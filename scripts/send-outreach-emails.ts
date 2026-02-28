/**
 * scripts/send-outreach-emails.ts
 * 
 * Send-only script: uses existing embed links to generate + send emails
 * WITHOUT re-running 3D generation (saves Meshy credits).
 * 
 * Usage: npx tsx scripts/send-outreach-emails.ts
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p = resolve(process.cwd(), 'firebase-adminsdk.json');
    if (fs.existsSync(p)) process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
}

import { Resend } from 'resend';

// ── Config ──────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? '3D-Snap <hello@3d-snap.com>';
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO ?? 'jonatankunisch@gmail.com';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'minimax/minimax-m2.5';

if (!RESEND_API_KEY) { console.error('❌ RESEND_API_KEY fehlt!'); process.exit(1); }
if (!OPENROUTER_API_KEY) { console.error('❌ OPENROUTER_API_KEY fehlt!'); process.exit(1); }

// ── Outreach data: existing embeds ──────────────────────────────
interface OutreachTarget {
    shopName: string;
    productName: string;
    shopUrl: string;
    embedUrl: string;
    recipientEmail: string;  // Must be manually set!
}

const TARGETS: OutreachTarget[] = [
    {
        shopName: '3DPrintNovesia',
        productName: 'Neusser Eierdieb',
        shopUrl: 'https://shop.3dprintnovesia.de/products/neusser-eierdieb',
        embedUrl: 'https://3d-snap.com/embed/cc02081d-caef-43e3-b318-14b7d84c31c1',
        recipientEmail: '', // TODO: Set manually
    },
    {
        shopName: '3DMichel',
        productName: 'Lithophane Lampe',
        shopUrl: 'https://www.3dmichel.com/produkt/lithophane-lampe-3d-druck-personalisiert/',
        embedUrl: 'https://3d-snap.com/embed/9c25a4f0-99bc-4d85-bd78-68489eb2f838',
        recipientEmail: '', // TODO: Set manually
    },
    {
        shopName: 'CAT LOURI',
        productName: '3D-gedruckte Vasen',
        shopUrl: 'https://catlouri.com/products/asthetische-3d-gedruckte-vasen-fur-dein-modernes-zuhause',
        embedUrl: 'https://3d-snap.com/embed/b3b335c5-9c9c-4f7a-bed3-3752d8646c09',
        recipientEmail: '', // TODO: Set manually
    },
];

// ── Email generation via OpenRouter ─────────────────────────────
async function generateEmail(shopName: string, productName: string, embedUrl: string): Promise<string> {
    const systemPrompt = [
        `Du bist der Lead Growth Hacker für 3D-Snap. Schreibe eine Kaltakquise-Email an den Shopbetreiber von ${shopName}.`,
        `Kontext: Du hast dir sein Bestseller-Produkt '${productName}' angesehen. Es hat aktuell kein 3D-Modell, was euch mobile Conversions kostet.`,
        `Der Pitch: Anstatt ihm etwas zu verkaufen, hast du sein Produktbild genommen und es in 30 Sekunden durch unsere 3D-Snap KI gejagt.`,
        `Call to Action: Er soll sich das fertige, interaktive 3D-Modell seines Produkts hier ansehen: ${embedUrl}. Wenn er sein restliches Inventar auch so mühelos in 3D verwandeln will, soll er antworten.`,
        `Tonfall: Extrem kurz, selbstbewusst, kein Marketing-Bullshit. Maximal 4 Sätze. Zeige, don't tell. Nutze Markdown.`,
        `Beginne mit einer Betreff-Zeile im Format: **Betreff: ...**`,
    ].join('\n');

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
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

    if (!res.ok) throw new Error(`OpenRouter: HTTP ${res.status}`);
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() ?? '';
}

function extractSubject(emailText: string, fallback: string): string {
    for (const line of emailText.split('\n')) {
        const t = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
        if (t.toLowerCase().startsWith('betreff:')) return t.replace(/^betreff:\s*/i, '').trim();
    }
    return `Dein ${fallback} in 3D`;
}

function emailToHtml(emailText: string, embedUrl: string): string {
    const lines = emailText.split('\n').filter(l => !l.toLowerCase().replace(/^\*\*/, '').trim().startsWith('betreff:'));
    const body = lines.join('\n').trim()
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#00aaff">$1</a>')
        .replace(/\n\n/g, '</p><p style="margin:12px 0;color:#333;font-size:15px;line-height:1.6;">')
        .replace(/\n/g, '<br/>');

    return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fafafa;">
      <p style="margin:12px 0;color:#333;font-size:15px;line-height:1.6;">${body}</p>
      <div style="margin:24px 0;padding:16px;background:#111;border-radius:12px;text-align:center;">
        <a href="${embedUrl}" style="color:#00aaff;font-size:14px;font-weight:bold;text-decoration:none;">👉 Interaktives 3D-Modell ansehen</a>
      </div>
      <hr style="border:1px solid #eee;margin:24px 0;"/>
      <p style="font-size:11px;color:#999;">Gesendet von <a href="https://3d-snap.com" style="color:#00aaff;">3D-Snap</a> — Foto zu 3D in 15 Sekunden.</p>
    </div>
  `;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
    const resend = new Resend(RESEND_API_KEY);
    const results: string[] = [];

    console.log(`\n📧 Send-Only Outreach: ${TARGETS.length} bestehende Embeds\n`);
    console.log(`   Absender: ${RESEND_FROM}`);
    console.log(`   Reply-To: ${RESEND_REPLY_TO}\n`);

    for (const t of TARGETS) {
        console.log(`\n━━━ ${t.shopName} ━━━`);
        console.log(`   Embed: ${t.embedUrl}`);

        if (!t.recipientEmail) {
            console.warn(`   ⚠️  Keine Empfänger-Email → wird übersprungen`);
            results.push(`❌ ${t.shopName}: kein Empfänger`);
            continue;
        }

        // Generate fresh email text
        console.log(`   📝 Generiere Email via OpenRouter...`);
        const emailText = await generateEmail(t.shopName, t.productName, t.embedUrl);
        const subject = extractSubject(emailText, t.productName);
        const html = emailToHtml(emailText, t.embedUrl);

        console.log(`   📨 Sende an ${t.recipientEmail}...`);
        console.log(`   Betreff: ${subject}`);

        const { data, error } = await resend.emails.send({
            from: RESEND_FROM,
            to: t.recipientEmail,
            replyTo: RESEND_REPLY_TO,
            subject,
            html,
        });

        if (error) {
            console.error(`   ❌ Fehler: ${JSON.stringify(error)}`);
            results.push(`❌ ${t.shopName}: ${JSON.stringify(error)}`);
        } else {
            console.log(`   ✅ Gesendet! ID: ${data?.id}`);
            results.push(`✅ ${t.shopName} → ${t.recipientEmail} (${data?.id})`);
        }
    }

    console.log(`\n\n━━━ ZUSAMMENFASSUNG ━━━`);
    results.forEach(r => console.log(`   ${r}`));
    console.log('');
}

main().catch(e => { console.error('FEHLER:', e); process.exit(1); });
