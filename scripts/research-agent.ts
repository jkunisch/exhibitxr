/**
 * scripts/research-agent.ts
 *
 * Outreach Research Agent — finds new 3D-print shops with products + contact emails.
 * Fills the contacts buffer (data/contacts.json) for the Outreach Crawler to consume.
 *
 * Usage:
 *   npx tsx scripts/research-agent.ts                    # Default search
 *   npx tsx scripts/research-agent.ts --limit 15         # Find up to 15 new shops
 *   npx tsx scripts/research-agent.ts --query "3D Druck" # Custom search query
 *   npx tsx scripts/research-agent.ts --dry-run          # Preview only, no saves
 *   npx tsx scripts/research-agent.ts --status            # Show buffer stats
 *
 * Searches Google for DACH 3D-print shops, scrapes product pages for og:image,
 * crawls Impressum/Kontakt pages for email, dedup against contacts.json.
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

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const EMAIL_BLACKLIST =
    /example|sentry|wixpress|addresshere|yourname|youremail|placeholder|noreply|no-reply|@2x|@3x|@1x|support@shopify|apps@shopify/i;

const DEFAULT_QUERIES = [
    '3D Druck Shop Deutschland Impressum',
    '3D gedruckt Produkte online kaufen Kontakt',
    '3D print shop Schweiz Österreich',
    '3D Druck Figuren Lampe Vase online bestellen',
    '3D Druck Schmuck Deko Shop',
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
}

function parseCli(argv: string[]): CliOpts {
    const opts: CliOpts = {
        limit: DEFAULT_SEARCH_LIMIT,
        query: '',
        dryRun: false,
        statusOnly: false,
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
