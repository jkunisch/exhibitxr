/**
 * scripts/outreach-crawler.ts
 *
 * ExhibitXR / 3D-Snap Outreach Crawler
 *
 * Dual-Mode CLI:
 *   1) Single-URL:
 *      npx tsx scripts/outreach-crawler.ts https://example.com/product
 *
 *   2) Batch-Mode (Datei):
 *      npx tsx scripts/outreach-crawler.ts targets.txt
 *
 * Optional:
 *   --dry-run   => Scraping + Download testen, aber keine Meshy/Firebase/OpenRouter Calls
 *   --limit 10  => nur im Batch-Mode: maximale Anzahl URLs (Default: 10)
 *
 * Outputs:
 *   - emails_to_send.md
 *   - outreach_results.csv  (shop_name,product_name,url,embed_link,status,error)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load .env.local variables (OPENROUTER_API_KEY, Firebase-Credentials, ...)
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// dotenv v17 corrupts the private_key in FIREBASE_SERVICE_ACCOUNT_KEY (partial unescape).
// Fallback: point firebaseAdmin.ts to the JSON file directly.
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const candidates = [
    resolve(process.cwd(), 'firebase-adminsdk.json'),
    resolve(process.cwd(), '..', 'Documents', 'ExhibitXR', 'secrets', 'firebase-adminsdk.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
      break;
    }
  }
}

import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { getAdminDb } from '../src/lib/firebaseAdmin';
import { submitImageTo3D, pollTaskStatus } from '../src/lib/meshy';
import type { PollResult } from '../src/lib/meshy';

/** ---------------- Konfiguration ---------------- */
const OUTREACH_TENANT_ID: string = process.env.OUTREACH_TENANT_ID ?? 'outreach-tenant';

const APP_URL: string = process.env.NEXT_PUBLIC_APP_URL ?? 'https://3dsnap.de';
const EMBED_BASE_URL: string = process.env.EMBED_BASE_URL ?? `${APP_URL}/embed`;

const OPENROUTER_API_KEY: string | undefined = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL: string = process.env.OPENROUTER_MODEL ?? 'minimax/minimax-m2.5';

// Resend email configuration
const RESEND_API_KEY: string | undefined = process.env.RESEND_API_KEY;
const RESEND_FROM: string = process.env.RESEND_FROM ?? '3D-Snap <hello@3d-snap.com>';
const RESEND_REPLY_TO: string = process.env.RESEND_REPLY_TO ?? 'jonatankunisch@gmail.com';

const DEFAULT_BATCH_LIMIT = 10;
const FETCH_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 45_000;
const FETCH_RETRY_DELAY_MS = 2_000;
const FETCH_MAX_RETRIES = 1;

// shopifyI5: Download-Validierung
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

// shopifyI6: Publish-Flag (Default: true, da Embed-Links sonst nicht funktionieren)
const OUTREACH_PUBLISH_DEFAULT: boolean = process.env.OUTREACH_PUBLISH_DEFAULT !== 'false';

// shopifyI7: Realistischer User-Agent
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const ZERO_VEC3: [number, number, number] = [0, 0, 0];

/** ---------------- Mini CLI Helpers ---------------- */
const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
} as const;

function info(msg: string): void {
  console.log(`${ANSI.cyan}ℹ${ANSI.reset} ${msg}`);
}
function ok(msg: string): void {
  console.log(`${ANSI.green}✅${ANSI.reset} ${msg}`);
}
function warn(msg: string): void {
  console.log(`${ANSI.yellow}⚠️${ANSI.reset} ${msg}`);
}
function err(msg: string): void {
  console.error(`${ANSI.red}❌${ANSI.reset} ${msg}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function printUsage(exitCode = 1): void {
  const text = `
${ANSI.bold}3D-Snap Outreach Crawler${ANSI.reset}

${ANSI.bold}Verwendung${ANSI.reset}
  npx tsx scripts/outreach-crawler.ts https://example.com/product
  npx tsx scripts/outreach-crawler.ts targets.txt

${ANSI.bold}Optionen${ANSI.reset}
  --dry-run           Nur Scraping + Download testen (keine Meshy/Firebase/OpenRouter-Aufrufe)
  --limit <zahl>      Nur Batch-Modus: Max. Anzahl URLs (Standard: ${DEFAULT_BATCH_LIMIT})
  --help              Hilfe anzeigen

${ANSI.bold}Ausgabe${ANSI.reset}
  - emails_to_send.md
  - outreach_results.csv  (shop_name,product_name,url,embed_link,status,error)
`.trim();

  console.log(text);
  process.exit(exitCode);
}

type CliOptions = {
  input: string;
  dryRun: boolean;
  limit: number;
};

function parseCli(argv: string[]): CliOptions {
  let input: string | undefined;
  let dryRun = false;
  let limit = DEFAULT_BATCH_LIMIT;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === '--help' || a === '-h') {
      printUsage(0);
    }

    if (a === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (a === '--limit') {
      const val = argv[i + 1];
      if (!val || val.startsWith('-')) {
        err('Bitte gib nach --limit eine Zahl an.');
        printUsage(1);
      }
      const parsed = Number.parseInt(val, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        err('Ungültiger Wert für --limit.');
        printUsage(1);
      }
      limit = parsed;
      i++; // skip value
      continue;
    }

    if (a.startsWith('-')) {
      err(`Unbekannte Option: ${a}`);
      printUsage(1);
    }

    if (!input) {
      input = a;
      continue;
    }
  }

  if (!input) {
    err('Bitte gib eine URL oder eine targets.txt Datei an.');
    printUsage(1);
  }

  return { input: input!, dryRun, limit };
}

function isSingleUrlArg(input: string): boolean {
  return input.trim().toLowerCase().startsWith('http');
}

function isProbablyHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function toAbsoluteUrl(imageUrl: string, pageUrl: string): string {
  try {
    return new URL(imageUrl, pageUrl).href;
  } catch {
    throw new Error(`Ungültige Bild-URL gefunden: ${imageUrl}`);
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: '*/*',
      },
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url: string, timeoutMs: number, label: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeoutMs);
      if (!res.ok) {
        throw new Error(`HTTP-Fehler ${res.status} (${res.statusText})`);
      }
      return res;
    } catch (e) {
      lastError = e;
      if (attempt < FETCH_MAX_RETRIES) {
        warn(`🔁 ${label} fehlgeschlagen – erneuter Versuch in ${FETCH_RETRY_DELAY_MS / 1000}s...`);
        await sleep(FETCH_RETRY_DELAY_MS);
        continue;
      }
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} fehlgeschlagen: ${msg}`);
}

/** ---------------- Pipeline Steps ---------------- */

type ScrapeResult = {
  shopName: string;
  productName: string;
  imageUrl: string;
  contactEmail: string | null;
};

async function scrapeShop(url: string): Promise<ScrapeResult> {
  console.log(`\n🔍 ${ANSI.bold}Scraping${ANSI.reset}: ${url}`);

  const res = await fetchWithRetry(url, FETCH_TIMEOUT_MS, 'Scraping');
  const html = await res.text();
  const $ = cheerio.load(html);

  const productNameRaw =
    $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unbekanntes Produkt';

  const shopNameRaw = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;

  const imageCandidate =
    $('meta[property="og:image:secure_url"]').attr('content') ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[property="twitter:image"]').attr('content') ||
    undefined;

  const productName = productNameRaw.trim() || 'Unbekanntes Produkt';
  const shopName = shopNameRaw.trim() || new URL(url).hostname;

  if (!imageCandidate) {
    throw new Error('Konnte kein og:image (oder twitter:image) auf der Seite finden.');
  }

  if (imageCandidate.startsWith('data:')) {
    throw new Error('og:image ist ein data:-URL – kann nicht heruntergeladen werden.');
  }

  const imageUrl = toAbsoluteUrl(imageCandidate.trim(), url);

  ok(`Shop: ${shopName}`);
  ok(`Produkt: ${productName}`);
  ok(`Bild: ${imageUrl}`);

  // Extract contact email from page (mailto: links, impressum, etc.)
  let contactEmail: string | null = null;
  const EMAIL_BLACKLIST = /example|sentry|wixpress|addresshere|yourname|youremail|placeholder|@2x|@3x|@1x/i;
  const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}/;

  const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6})/i);
  if (mailtoMatch && !EMAIL_BLACKLIST.test(mailtoMatch[1])) {
    contactEmail = mailtoMatch[1];
  } else {
    // Try to find email pattern in visible text (skip image URLs, scripts, etc.)
    const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const emailMatch = textOnly.match(EMAIL_RE);
    if (emailMatch && !EMAIL_BLACKLIST.test(emailMatch[0]) && !emailMatch[0].match(/\.(jpg|png|gif|webp|svg|avif)/i)) {
      contactEmail = emailMatch[0];
    }
  }
  if (contactEmail) ok(`📧 Kontakt: ${contactEmail}`);

  return { shopName, productName, imageUrl, contactEmail };
}

async function downloadImage(imageUrl: string): Promise<Buffer> {
  console.log('⬇️  Lade Bild herunter...');
  const res = await fetchWithRetry(imageUrl, DOWNLOAD_TIMEOUT_MS, 'Bild-Download');

  // shopifyI5: MIME-Type validieren
  const contentType = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (contentType && !ALLOWED_IMAGE_MIMES.includes(contentType)) {
    throw new Error(`Nicht unterstütztes Bildformat: ${contentType} (erlaubt: ${ALLOWED_IMAGE_MIMES.join(', ')})`);
  }

  // shopifyI5: Dateigröße prüfen
  const contentLength = res.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_IMAGE_BYTES) {
    throw new Error(`Bild zu groß: ${(Number.parseInt(contentLength, 10) / 1024 / 1024).toFixed(1)}MB (max: ${MAX_IMAGE_BYTES / 1024 / 1024}MB)`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Auch nach Download nochmal prüfen (content-length ist nicht immer gesetzt)
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`Bild zu groß: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB (max: ${MAX_IMAGE_BYTES / 1024 / 1024}MB)`);
  }

  ok(`Bild heruntergeladen: ${(buffer.byteLength / 1024).toFixed(0)}KB`);
  return buffer;
}

function safeFilenameFromTitle(title: string): string {
  const base = title
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 80);
  return `${base || 'produkt'}.jpg`;
}

// shopifyI1: Use typed returns from meshy.ts directly — no unknown casts, no duplicate parsers
async function generate3D(imageBuffer: Buffer, productName: string): Promise<string> {
  console.log('⚡ Starte 3D-Snap Generierung via Meshy API...');

  const filename = safeFilenameFromTitle(productName);

  // submitImageTo3D returns typed GenerateResult { taskId: string }
  const { taskId } = await submitImageTo3D(imageBuffer, filename);

  info(`⏳ Task gestartet (ID: ${taskId}). Status-Abfrage...`);

  const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 Minuten Gesamtlimit
  const POLL_INTERVAL_MS = 5_000;          // 5s zwischen Polls
  const SINGLE_POLL_TIMEOUT_MS = 15_000;   // 15s Timeout pro einzelnen Poll-Call
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    // Hard deadline check after sleep
    if (Date.now() >= deadline) break;

    let poll: PollResult;
    try {
      // Wrap pollTaskStatus with its own AbortController timeout
      const result = await Promise.race([
        pollTaskStatus(taskId),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Poll-Timeout (15s)')), SINGLE_POLL_TIMEOUT_MS);
        }),
      ]);
      poll = result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      warn(`Poll-Fehler (wird wiederholt): ${msg}`);
      continue; // Retry on next iteration — deadline still enforced
    }

    const progressText = `${Math.round(poll.progress)}%`;
    process.stdout.write(`\r   ${ANSI.dim}Fortschritt${ANSI.reset}: ${progressText} (${poll.status})`);

    if (poll.status === 'SUCCEEDED' && poll.glbUrl) {
      process.stdout.write('\n');
      ok('3D-Modell fertig generiert!');
      return poll.glbUrl;
    }

    if (poll.status === 'FAILED' || poll.status === 'EXPIRED') {
      process.stdout.write('\n');
      const reason = poll.error ? ` (${poll.error})` : '';
      throw new Error(`Meshy Task fehlgeschlagen${reason}`);
    }
  }

  process.stdout.write('\n');
  throw new Error(`Timeout nach ${POLL_TIMEOUT_MS / 60_000} Minuten erreicht. Task-ID: ${taskId}`);
}

// shopifyI4: Guard — ensure outreach tenant doc exists before writing exhibitions
let tenantChecked = false;

async function ensureTenantExists(): Promise<void> {
  if (tenantChecked) return;

  const db = getAdminDb();
  const tenantRef = db.collection('tenants').doc(OUTREACH_TENANT_ID);
  const snap = await tenantRef.get();

  if (!snap.exists) {
    warn(`Tenant '${OUTREACH_TENANT_ID}' existiert nicht in Firestore – wird angelegt...`);
    await tenantRef.set({
      id: OUTREACH_TENANT_ID,
      name: 'Outreach Crawler',
      plan: 'free',
      generationCredits: 0,
      totalGenerationsUsed: 0,
    });
    ok(`Tenant '${OUTREACH_TENANT_ID}' wurde angelegt.`);
  } else {
    info(`Tenant '${OUTREACH_TENANT_ID}' gefunden.`);
  }

  tenantChecked = true;
}

async function saveToDatabase(productName: string, meshyGlbUrl: string): Promise<string> {
  console.log('💾 Speichere in Firebase (Firestore + Storage)...');

  // shopifyI4: Tenant-Guard
  await ensureTenantExists();

  const db = getAdminDb();
  const exhibitionId = randomUUID();
  const modelId = randomUUID();

  // ── Download GLB from Meshy (server-side, no CORS issue) ───────────
  console.log('  ⬇️  Lade GLB von Meshy herunter...');
  const glbResponse = await fetch(meshyGlbUrl, { method: 'GET' });
  if (!glbResponse.ok) {
    throw new Error(`GLB-Download fehlgeschlagen: HTTP ${glbResponse.status}`);
  }
  const glbBuffer = Buffer.from(await glbResponse.arrayBuffer());
  const glbSizeKB = Math.round(glbBuffer.length / 1024);
  ok(`  GLB heruntergeladen: ${glbSizeKB}KB`);

  // ── Upload to Firebase Storage (CORS-safe) ───────────────────────
  console.log('  ☁️  Upload zu Firebase Storage...');
  const { getStorage } = await import('firebase-admin/storage');
  const { getAdminApp } = await import('../src/lib/firebaseAdmin');
  const storage = getStorage(getAdminApp());
  const bucket = storage.bucket();
  const downloadToken = randomUUID();
  const storagePath = `tenants/${OUTREACH_TENANT_ID}/models/${exhibitionId}.glb`;
  const storageFile = bucket.file(storagePath);

  await storageFile.save(glbBuffer, {
    resumable: false,
    metadata: {
      contentType: 'model/gltf-binary',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        tenantId: OUTREACH_TENANT_ID,
        source: 'outreach-crawler',
      },
    },
  });

  const encodedPath = encodeURIComponent(storagePath);
  const glbUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
  ok(`  Firebase Storage URL erstellt`);

  await db
    .collection('tenants')
    .doc(OUTREACH_TENANT_ID)
    .collection('exhibitions')
    .doc(exhibitionId)
    .set({
      id: exhibitionId,
      tenantId: OUTREACH_TENANT_ID,
      title: `Outreach: ${productName}`,
      isPublished: OUTREACH_PUBLISH_DEFAULT,
      glbUrl,
      environment: 'studio',
      // shopifyI2: Schema-Defaults aus ExhibitConfigSchema
      stageType: 'none',
      envRotation: 0,
      entryAnimation: 'none',
      ambientIntensity: 0.8,
      contactShadows: true,
      autoRotate: true,   // Auto-start for outreach embeds — no click needed
      cameraPosition: [0, 1.5, 4],
      bgColor: '#18181b',
      model: {
        id: modelId,
        label: productName,
        glbUrl,
        scale: 1,
        position: ZERO_VEC3,
        variants: [],
        hotspots: [],
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  const embedUrl = `${EMBED_BASE_URL}/${exhibitionId}`;
  ok(`🔗 Sharebarer Embed-Link erstellt: ${embedUrl}`);
  return embedUrl;
}

async function generateEmail(shopName: string, productName: string, embedUrl: string): Promise<string> {
  console.log(`📧 Generiere personalisierte Kaltakquise-Mail via OpenRouter (${OPENROUTER_MODEL})...`);

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY fehlt in der .env.local!');
  }

  const systemPrompt = [
    `Du bist der Lead Growth Hacker für 3D-Snap. Schreibe eine Kaltakquise-Email an den Shopbetreiber von ${shopName}.`,
    `Kontext: Du hast dir sein Bestseller-Produkt '${productName}' angesehen. Es hat aktuell kein 3D-Modell, was euch mobile Conversions kostet.`,
    `Der Pitch: Anstatt ihm etwas zu verkaufen, hast du sein Produktbild genommen und es in 30 Sekunden durch unsere 3D-Snap KI gejagt.`,
    `Call to Action: Er soll sich das fertige, interaktive 3D-Modell seines Produkts hier ansehen: ${embedUrl}. Wenn er sein restliches Inventar auch so mühelos in 3D verwandeln will, soll er antworten.`,
    `Tonfall: Extrem kurz, selbstbewusst, kein Marketing-Bullshit. Maximal 4 Sätze. Zeige, don't tell. Nutze Markdown.`,
  ].join('\n');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_URL,
      'X-Title': '3D-Snap Outreach Crawler',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Schreibe die Email jetzt.' },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter API fehlgeschlagen (HTTP ${res.status}): ${errorText}`);
  }

  const json = await res.json();
  const emailText: string | undefined = json?.choices?.[0]?.message?.content;
  if (!emailText || !emailText.trim()) {
    throw new Error('OpenRouter: Keine Email im Response gefunden (choices[0].message.content).');
  }

  return emailText.trim();
}

/** Extract subject line from generated email (first line starting with 'Betreff:') */
function extractSubject(emailText: string, fallbackProduct: string): string {
  for (const line of emailText.split('\n')) {
    const trimmed = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    if (trimmed.toLowerCase().startsWith('betreff:')) {
      return trimmed.replace(/^betreff:\s*/i, '').trim();
    }
  }
  return `Dein ${fallbackProduct} in 3D`;
}

/** Send email via Resend */
async function sendEmail(
  recipientEmail: string,
  subject: string,
  bodyHtml: string,
): Promise<string | null> {
  if (!RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY fehlt — Email wird NICHT gesendet (nur als Draft gespeichert)');
    return null;
  }

  const resend = new Resend(RESEND_API_KEY);
  console.log(`📨 Sende Email via Resend an ${recipientEmail}...`);

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: recipientEmail,
    replyTo: RESEND_REPLY_TO,
    subject,
    html: bodyHtml,
  });

  if (error) {
    err(`Resend-Fehler: ${JSON.stringify(error)}`);
    return null;
  }

  ok(`✅ Email gesendet! ID: ${data?.id}`);
  return data?.id ?? null;
}

/** Convert markdown-ish email text to basic HTML */
function emailToHtml(emailText: string, embedUrl: string): string {
  // Strip subject line if present
  const lines = emailText.split('\n').filter(l => !l.toLowerCase().replace(/^\*\*/, '').trim().startsWith('betreff:'));
  const body = lines.join('\n').trim();

  // Convert markdown links and bold
  const htmlBody = body
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#00aaff">$1</a>')
    .replace(/\n\n/g, '</p><p style="margin:12px 0;color:#333;font-size:15px;line-height:1.6;">')
    .replace(/\n/g, '<br/>');

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fafafa;">
      <p style="margin:12px 0;color:#333;font-size:15px;line-height:1.6;">${htmlBody}</p>
      <div style="margin:24px 0;padding:16px;background:#111;border-radius:12px;text-align:center;">
        <a href="${embedUrl}" style="color:#00aaff;font-size:14px;font-weight:bold;text-decoration:none;">👉 Interaktives 3D-Modell ansehen</a>
      </div>
      <hr style="border:1px solid #eee;margin:24px 0;"/>
      <p style="font-size:11px;color:#999;">Gesendet von <a href="https://3d-snap.com" style="color:#00aaff;">3D-Snap</a> — Foto zu 3D in 15 Sekunden.</p>
    </div>
  `;
}

/** ---------------- Output & Orchestrierung ---------------- */

type CsvRow = {
  shop_name: string;
  product_name: string;
  url: string;
  embed_link: string;
  email_sent: string;
  status: string;
  error: string;
};

function csvEscape(value: string): string {
  const v = value ?? '';
  const needsQuotes = /[",\n\r]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

async function readUrlsFromFile(filePath: string): Promise<string[]> {
  const raw = await fs.promises.readFile(filePath, 'utf-8');

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !l.startsWith('#'));

  return lines.filter((l) => isProbablyHttpUrl(l));
}

async function main(): Promise<void> {
  const opts = parseCli(process.argv.slice(2));

  if (!opts.dryRun && !OPENROUTER_API_KEY) {
    err('OPENROUTER_API_KEY fehlt in der .env.local!');
    process.exit(1);
  }

  const dryRunLabel = opts.dryRun
    ? '🧪 Dry-Run aktiv (keine Meshy/Firebase/OpenRouter-Aufrufe)'
    : 'Live-Modus aktiv';
  info(dryRunLabel);

  const urls: string[] = [];
  const input = opts.input;

  if (isSingleUrlArg(input)) {
    urls.push(input.trim());
    info('Einzel-URL-Modus: 1 URL wird verarbeitet.');
  } else {
    if (!fs.existsSync(input) || !fs.statSync(input).isFile()) {
      err(`Datei nicht gefunden: ${input}`);
      process.exit(1);
    }

    const all = await readUrlsFromFile(input);
    if (all.length === 0) {
      err('Keine gültigen URLs in der Datei gefunden. (Tipp: Jede Zeile eine URL, Kommentare mit #)');
      process.exit(1);
    }

    const capped = all.slice(0, opts.limit);
    urls.push(...capped);

    info(`Batch-Modus: ${all.length} URLs gefunden → verarbeite ${urls.length} (limit=${opts.limit}).`);
  }

  let markdownOut = `# 📧 Outreach E-Mails\n\n`;
  const rows: CsvRow[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    let shopName = '';
    let productName = '';
    let embedLink = '';

    console.log(`\n${ANSI.bold}========================================================${ANSI.reset}`);
    console.log(`${ANSI.bold}🔄 Verarbeite URL ${i + 1}/${urls.length}:${ANSI.reset} ${url}`);
    console.log(`${ANSI.bold}========================================================${ANSI.reset}`);

    try {
      if (opts.dryRun) {
        const scraped = await scrapeShop(url);
        shopName = scraped.shopName;
        productName = scraped.productName;
        await downloadImage(scraped.imageUrl);

        const placeholderEmbed = `${EMBED_BASE_URL}/DRY_RUN`;
        embedLink = placeholderEmbed;

        markdownOut += [
          `## ${shopName}`,
          `**URL:** ${url}`,
          ``,
          `*(Dry-Run)* Scraping + Bild-Download erfolgreich.`,
          ``,
          `**Embed:** ${placeholderEmbed} *(Platzhalter – kein Firestore Eintrag)*`,
          ``,
          `---`,
          ``,
        ].join('\n');

        rows.push({
          shop_name: shopName,
          product_name: productName,
          url,
          embed_link: placeholderEmbed,
          email_sent: '',
          status: 'DRY_RUN_OK',
          error: '',
        });

        ok(`Dry-Run fertig: ${shopName}`);
        continue;
      }

      // Live-Mode
      const scraped = await scrapeShop(url);
      shopName = scraped.shopName;
      productName = scraped.productName;
      const imageBuffer = await downloadImage(scraped.imageUrl);
      const glbUrl = await generate3D(imageBuffer, productName);
      const embedUrl = await saveToDatabase(productName, glbUrl);
      embedLink = embedUrl;
      const emailText = await generateEmail(shopName, productName, embedUrl);

      // ── Send Email via Resend ───────────────────────────────────
      const subject = extractSubject(emailText, productName);
      const htmlBody = emailToHtml(emailText, embedUrl);
      let emailSentId: string | null = null;

      // Try to find contact email from scraped page
      const contactEmail = scraped.contactEmail;
      if (contactEmail) {
        emailSentId = await sendEmail(contactEmail, subject, htmlBody);
      } else {
        console.warn(`⚠️  Keine Kontakt-Email für ${shopName} gefunden — Email wird nur als Draft gespeichert.`);
      }

      markdownOut += [
        `## E-Mail an: ${shopName}`,
        `**URL:** ${url}`,
        `**Kontakt:** ${contactEmail || '❌ nicht gefunden'}`,
        `**Gesendet:** ${emailSentId ? `✅ (${emailSentId})` : '❌ Nein'}`,
        ``,
        `**Betreff:** ${subject}`,
        ``,
        `${emailText}`,
        ``,
        `**Embed:** ${embedUrl}`,
        ``,
        `---`,
        ``,
      ].join('\n');

      rows.push({
        shop_name: shopName,
        product_name: productName,
        url,
        embed_link: embedUrl,
        email_sent: emailSentId ?? '',
        status: 'OK',
        error: '',
      });

      ok(`Fertig: ${shopName}`);
    } catch (e) {
      const message = formatError(e);
      err(`Fehler bei URL ${url}: ${message}`);

      markdownOut += [
        `## Fehler`,
        `**URL:** ${url}`,
        ``,
        `**Grund:** ${message}`,
        ``,
        `---`,
        ``,
      ].join('\n');

      rows.push({
        shop_name: shopName,
        product_name: productName,
        url,
        embed_link: embedLink,
        email_sent: '',
        status: opts.dryRun ? 'DRY_RUN_FEHLER' : 'FEHLER',
        error: message,
      });

      continue;
    }
  }

  await fs.promises.writeFile('emails_to_send.md', markdownOut, 'utf-8');
  ok(`📁 E-Mails/Ergebnisse gespeichert: emails_to_send.md`);

  const header = ['shop_name', 'product_name', 'url', 'embed_link', 'email_sent', 'status', 'error'];
  const csvLines = [
    header.join(','),
    ...rows.map((r) =>
      [r.shop_name, r.product_name, r.url, r.embed_link, r.email_sent, r.status, r.error].map(csvEscape).join(',')
    ),
  ];

  await fs.promises.writeFile('outreach_results.csv', csvLines.join('\n'), 'utf-8');
  ok(`📁 CSV gespeichert: outreach_results.csv`);

  console.log(`\n🚀 Workflow beendet.`);
}

main().catch((e) => {
  err(`KRITISCHER FEHLER: ${formatError(e)}`);
  process.exit(1);
});