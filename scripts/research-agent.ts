/**
 * scripts/research-agent.ts
 *
 * Outreach Research Agent — finds shops with physical products that would benefit
 * from interactive 3D product visualization. NOT limited to 3D-print shops!
 * Targets: furniture, jewelry, fashion accessories, home decor, electronics, etc.
 *
 * Uses an LLM qualification step to evaluate if a product is suitable for 3D.
 *
 * Usage:
 *   npx tsx scripts/research-agent.ts                    # Default search
 *   npx tsx scripts/research-agent.ts --limit 15         # Find up to 15 new shops
 *   npx tsx scripts/research-agent.ts --query "Möbelshop" # Custom search query
 *   npx tsx scripts/research-agent.ts --dry-run          # Preview only, no saves
 *   npx tsx scripts/research-agent.ts --status            # Show buffer stats
 *   npx tsx scripts/research-agent.ts --no-llm           # Skip LLM qualification
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p = resolve(process.cwd(), 'firebase-adminsdk.json');
    if (fs.existsSync(p)) process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
}

import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';
import { GoogleAuth } from 'google-auth-library';
import {
    loadContacts,
    addContact,
    getBufferSize,
    getStats,
    isDomainKnown,
    type Contact,
} from '../src/lib/contacts';

// ── Config ──────────────────────────────────────────────────────
const BUFFER_THRESHOLD = 10;
const DEFAULT_SEARCH_LIMIT = 15;
const FETCH_TIMEOUT_MS = 15_000;

// Vertex AI (Gemini) config — uses firebase-adminsdk.json for auth
const GCP_PROJECT = 'exhibitxr';
const GCP_LOCATION = 'europe-west1';
const GEMINI_MODEL = 'gemini-3-flash-preview';

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const EMAIL_BLACKLIST =
    /example|sentry|wixpress|addresshere|yourname|youremail|ihremail|placeholder|noreply|no-reply|@email\.de|@2x|@3x|@1x|support@shopify|apps@shopify/i;

// Broad queries: ANY shop that sells physical products suitable for 3D visualization
const DEFAULT_QUERIES = [
    'Möbel Online-Shop Deutschland Impressum',
    'Schmuck handgemacht Online-Shop Kontakt',
    'Design Lampen Leuchten Shop Deutschland',
    'Wohnaccessoires Deko Online bestellen Impressum',
    'Sneaker Schuhe Online-Shop Deutschland',
    'Luxus Uhren Shop Kontakt Deutschland',
    'Handtaschen Lederwaren Online-Shop',
    'Keramik Vasen Deko Online kaufen',
    'Modeschmuck Accessoires Shop Deutschland',
    'Elektronik Gadgets Shop Impressum',
];

// ── ANSI helpers ────────────────────────────────────────────────
const ok = (msg: string) => console.log(`✅ ${msg}`);
const warn = (msg: string) => console.warn(`⚠️  ${msg}`);
const err = (msg: string) => console.error(`❌ ${msg}`);
const info = (msg: string) => console.log(`ℹ ${msg}`);

// ── CLI ─────────────────────────────────────────────────────────
interface CliOpts {
    limit: number;
    query: string;
    dryRun: boolean;
    statusOnly: boolean;
    useLlm: boolean;
}

function parseCli(argv: string[]): CliOpts {
    const opts: CliOpts = {
        limit: DEFAULT_SEARCH_LIMIT,
        query: '',
        dryRun: false,
        statusOnly: false,
        useLlm: true,
    };

    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--limit' && argv[i + 1]) {
            opts.limit = parseInt(argv[++i], 10);
        } else if (argv[i] === '--query' && argv[i + 1]) {
            opts.query = argv[++i];
        } else if (argv[i] === '--dry-run') {
            opts.dryRun = true;
        } else if (argv[i] === '--status') {
            opts.statusOnly = true;
        } else if (argv[i] === '--no-llm') {
            opts.useLlm = false;
        }
    }

    return opts;
}

// ── HTTP helpers ────────────────────────────────────────────────
async function fetchPage(url: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
            redirect: 'follow',
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    }
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

// ── DuckDuckGo search (HTML scraping, no CAPTCHA) ──────────────
async function searchShops(query: string, numResults: number = 20): Promise<string[]> {
    info(`🔍 DuckDuckGo-Suche: "${query}"`);
    const encoded = encodeURIComponent(query);

    // DuckDuckGo HTML endpoint (no JS required)
    const url = `https://html.duckduckgo.com/html/?q=${encoded}&kl=de-de`;

    const html = await fetchPage(url);
    if (!html) {
        warn('DuckDuckGo-Suche fehlgeschlagen');
        return [];
    }

    const $ = cheerio.load(html);
    const urls: string[] = [];

    // DuckDuckGo HTML results have class "result__url" or "result__a"
    $('a.result__a').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        if (href.startsWith('http')) {
            urls.push(href);
        } else if (href.startsWith('//')) {
            // DuckDuckGo sometimes redirects through uddg parameter
            const uddgMatch = href.match(/uddg=(https?%3A%2F%2F[^&]+)/);
            if (uddgMatch) {
                urls.push(decodeURIComponent(uddgMatch[1]));
            }
        }
    });

    // Also try extracting from href with uddg redirect
    $('a[href*="uddg="]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const match = href.match(/uddg=(https?%3A%2F%2F[^&]+)/);
        if (match) {
            urls.push(decodeURIComponent(match[1]));
        }
    });

    // Filter out non-shop domains
    const filtered = [...new Set(urls)].filter(u => {
        const domain = extractDomain(u);
        return (
            domain &&
            !domain.includes('google.') &&
            !domain.includes('youtube.') &&
            !domain.includes('wikipedia.') &&
            !domain.includes('amazon.') &&
            !domain.includes('ebay.') &&
            !domain.includes('facebook.') &&
            !domain.includes('instagram.') &&
            !domain.includes('twitter.') &&
            !domain.includes('duckduckgo.') &&
            !domain.includes('reddit.')
        );
    });

    info(`   ${filtered.length} URLs gefunden`);
    return filtered.slice(0, numResults);
}

// ── Scrape shop page for product info ───────────────────────────
interface ProductInfo {
    productName: string;
    imageUrl: string | null;
    shopName: string;
}

function scrapeProductInfo(html: string, url: string): ProductInfo | null {
    const $ = cheerio.load(html);

    const productName = (
        $('meta[property="og:title"]').attr('content') ||
        $('title').text() ||
        ''
    ).trim();

    const shopName = (
        $('meta[property="og:site_name"]').attr('content') ||
        extractDomain(url)
    ).trim();

    const imageUrl =
        $('meta[property="og:image:secure_url"]').attr('content') ||
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        null;

    if (!productName) return null;
    return { productName, imageUrl, shopName };
}

// ── Email extraction ────────────────────────────────────────────
function extractEmail(html: string): string | null {
    const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}/;

    // Priority 1: mailto: links
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6})/i);
    if (mailtoMatch && !EMAIL_BLACKLIST.test(mailtoMatch[1])) {
        return mailtoMatch[1];
    }

    // Priority 2: Visible text (strip scripts/styles)
    const textOnly = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '');
    const emailMatch = textOnly.match(EMAIL_RE);
    if (
        emailMatch &&
        !EMAIL_BLACKLIST.test(emailMatch[0]) &&
        !emailMatch[0].match(/\.(jpg|png|gif|webp|svg|avif)/i)
    ) {
        return emailMatch[0];
    }

    return null;
}

// ── Find contact email from shop ────────────────────────────────
async function findContactEmail(shopDomain: string, productPageHtml: string): Promise<string | null> {
    // Try product page first
    const fromProduct = extractEmail(productPageHtml);
    if (fromProduct) return fromProduct;

    // Try common contact/impressum paths
    const basePaths = [
        '/impressum',
        '/pages/impressum',
        '/policies/legal-notice',
        '/kontakt',
        '/pages/kontakt',
        '/contact',
        '/pages/contact',
        '/about',
        '/ueber-uns',
    ];

    const baseUrl = `https://${shopDomain}`;

    for (const path of basePaths) {
        const html = await fetchPage(`${baseUrl}${path}`);
        if (!html) continue;

        const email = extractEmail(html);
        if (email) return email;
    }

    return null;
}

// ── LLM Qualification (Vertex AI Gemini) ────────────────────────
interface LlmVerdict {
    suitable: boolean;
    reason: string;
    bestProduct: string;
}

let _cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getVertexAccessToken(): Promise<string> {
    // Cache token (valid ~1 hour)
    if (_cachedAccessToken && Date.now() < _cachedAccessToken.expiresAt - 60_000) {
        return _cachedAccessToken.token;
    }

    const auth = new GoogleAuth({
        keyFile: resolve(process.cwd(), 'firebase-adminsdk.json'),
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const tokenRes = await client.getAccessToken();
    const token = typeof tokenRes === 'string' ? tokenRes : tokenRes?.token;

    if (!token) throw new Error('Konnte kein Vertex AI Access Token erhalten');

    _cachedAccessToken = { token, expiresAt: Date.now() + 3_500_000 };
    return token;
}

async function qualifyShopWithLlm(
    shopName: string,
    productName: string,
    shopUrl: string,
    ogDescription?: string,
): Promise<LlmVerdict> {
    const prompt = [
        'Du bist ein Sales-Qualifier für 3D-Snap, einen Service der physische Produkte als interaktive 3D-Modelle für Online-Shops erstellt.',
        '',
        `Analysiere diesen Shop:`,
        `- Shop: ${shopName}`,
        `- Produkt: ${productName}`,
        `- URL: ${shopUrl}`,
        ogDescription ? `- Beschreibung: ${ogDescription}` : '',
        '',
        'Bewerte: Würde dieser Shop von interaktiven 3D-Produktmodellen profitieren?',
        '',
        'GEEIGNET sind Shops die physische Produkte verkaufen, die man drehen/inspizieren möchte:',
        '- Möbel, Lampen, Vasen, Deko-Objekte',
        '- Schmuck, Uhren, Accessoires',
        '- Schuhe, Taschen, Mode-Accessoires',
        '- Elektronik, Gadgets',
        '- Figuren, Skulpturen, Kunstobjekte',
        '- Haushaltsgeräte mit Design-Aspekt',
        '',
        'NICHT GEEIGNET sind:',
        '- Reine Dienstleistungen (Beratung, Software)',
        '- Digitale Produkte (eBooks, Kurse)',
        '- Lebensmittel, Kosmetik (flach/einfach)',
        '- Druckereien / B2B-Industrieteile',
        '- Shops die bereits 3D/AR nutzen',
        '',
        'Antwort NUR als JSON (kein Markdown):',
        '{ "suitable": true/false, "reason": "Kurze Begründung", "bestProduct": "Bestes Produkt für 3D-Demo" }',
    ].filter(Boolean).join('\n');

    try {
        const accessToken = await getVertexAccessToken();
        const endpoint = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/publishers/google/models/${GEMINI_MODEL}:generateContent`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 200,
                    responseMimeType: 'application/json',
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            warn(`   Vertex AI Fehler (HTTP ${res.status}): ${errText.slice(0, 200)}`);
            return { suitable: true, reason: 'Vertex AI error, defaulting', bestProduct: productName };
        }

        const json = await res.json();
        const raw: string = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

        // Parse JSON from response
        const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr) as LlmVerdict;
        return parsed;
    } catch (e) {
        warn(`   LLM-Parsing fehlgeschlagen — qualifiziere trotzdem`);
        return { suitable: true, reason: 'Parse error, defaulting', bestProduct: productName };
    }
}

// ── Main pipeline ───────────────────────────────────────────────
async function main() {
    const opts = parseCli(process.argv.slice(2));

    // Status-only mode
    if (opts.statusOnly) {
        const stats = getStats();
        const total = loadContacts().length;
        console.log('\n📊 Contacts Buffer Status:\n');
        console.log(`   Total:           ${total}`);
        console.log(`   Researched:      ${stats.researched} (ready for outreach)`);
        console.log(`   Model Generated: ${stats.model_generated}`);
        console.log(`   Sent:            ${stats.sent}`);
        console.log(`   Failed:          ${stats.failed}`);
        console.log(`\n   Buffer Threshold: ${BUFFER_THRESHOLD}`);
        console.log(
            `   Status:          ${stats.researched >= BUFFER_THRESHOLD ? '✅ Buffer voll' : `⚠️ Buffer niedrig (${stats.researched}/${BUFFER_THRESHOLD})`}`,
        );
        console.log('');
        return;
    }

    // Buffer check
    const currentBuffer = getBufferSize();
    if (currentBuffer >= BUFFER_THRESHOLD && !opts.dryRun) {
        info(`Buffer ist voll (${currentBuffer}/${BUFFER_THRESHOLD} researched Kontakte).`);
        info('Starte zuerst den Outreach Crawler, um den Buffer abzuarbeiten.');
        info('Erzwinge mit --limit X um trotzdem zu suchen.');
        if (!opts.limit) return;
    }

    const queries = opts.query ? [opts.query] : DEFAULT_QUERIES;
    let found = 0;
    const maxFind = opts.limit;

    console.log(`\n🔎 Research Agent — suche bis zu ${maxFind} neue Shops\n`);
    if (opts.dryRun) info('🧪 Dry-Run aktiv — keine Speicherung\n');

    for (const query of queries) {
        if (found >= maxFind) break;

        const urls = await searchShops(query, 20);

        for (const url of urls) {
            if (found >= maxFind) break;

            const domain = extractDomain(url);
            if (!domain) continue;

            // Dedup check
            if (isDomainKnown(domain)) {
                continue; // Silently skip known domains
            }

            console.log(`\n━━━ ${domain} ━━━`);
            console.log(`   URL: ${url}`);

            // Fetch product page
            const html = await fetchPage(url);
            if (!html) {
                warn('   Seite nicht erreichbar');
                continue;
            }

            // Extract product info
            const product = scrapeProductInfo(html, url);
            if (!product) {
                warn('   Kein Produktname gefunden');
                continue;
            }
            if (!product.imageUrl) {
                warn('   Kein og:image gefunden → übersprungen');
                continue;
            }

            ok(`   Shop: ${product.shopName}`);
            ok(`   Produkt: ${product.productName}`);

            // LLM qualification (if enabled)
            if (opts.useLlm) {
                const $ = cheerio.load(html);
                const ogDesc = $('meta[property="og:description"]').attr('content') ?? undefined;
                info(`   🤖 LLM-Qualifizierung...`);
                const verdict = await qualifyShopWithLlm(product.shopName, product.productName, url, ogDesc);
                if (!verdict.suitable) {
                    warn(`   ❌ Nicht geeignet: ${verdict.reason}`);
                    continue;
                }
                ok(`   ✅ Geeignet: ${verdict.reason}`);
                if (verdict.bestProduct !== product.productName) {
                    info(`   💡 Bestes Produkt: ${verdict.bestProduct}`);
                }
            }

            // Find contact email
            const email = await findContactEmail(domain, html);
            if (!email) {
                warn('   Keine Kontakt-Email gefunden → übersprungen');
                continue;
            }

            ok(`   📧 Email: ${email}`);

            if (opts.dryRun) {
                ok('   (Dry-Run — nicht gespeichert)');
                found++;
                continue;
            }

            // Save to contacts
            const contact: Contact = {
                id: randomUUID(),
                shopName: product.shopName,
                shopDomain: domain,
                shopUrl: `https://${domain}`,
                productUrl: url,
                productName: product.productName,
                email,
                status: 'researched',
                researchedAt: new Date().toISOString(),
            };

            const added = addContact(contact);
            if (added) {
                ok('   💾 Gespeichert in contacts.json');
                found++;
            } else {
                warn('   Duplikat → übersprungen');
            }
        }
    }

    console.log(`\n\n━━━ ERGEBNIS ━━━`);
    console.log(`   ${found} neue Shops gefunden`);

    const stats = getStats();
    console.log(`   Buffer: ${stats.researched} researched (Threshold: ${BUFFER_THRESHOLD})`);
    console.log(`   Total Kontakte: ${loadContacts().length}\n`);

    if (stats.researched > 0 && !opts.dryRun) {
        console.log('👉 Nächster Schritt: npx tsx scripts/outreach-crawler.ts\n');
    }
}

main().catch(e => {
    err(`KRITISCHER FEHLER: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
});
