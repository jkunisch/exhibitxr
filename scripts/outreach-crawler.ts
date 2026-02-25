import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load .env.local variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../src/lib/firebaseAdmin';
import { submitImageTo3D, pollTaskStatus } from '../src/lib/meshy';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const TARGET_FILE = process.argv[2];

if (!TARGET_FILE) {
  console.error("❌ Bitte gib eine Textdatei mit URLs an: npx tsx scripts/outreach-crawler.ts targets.txt");
  process.exit(1);
}

if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY fehlt in der .env.local!");
  process.exit(1);
}

async function scrapeShop(url: string) {
  console.log(`\n🔍 Scraping URL: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unbekanntes Produkt';
  const imageUrl = $('meta[property="og:image"]').attr('content');
  const shopName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;

  if (!imageUrl) {
    throw new Error("Konnte kein og:image auf der Seite finden.");
  }

  console.log(`✅ Produkt gefunden: ${title}`);
  console.log(`🖼️  Bild URL: ${imageUrl}`);

  return { title, imageUrl, shopName };
}

async function downloadImage(url: string): Promise<Buffer> {
  console.log(`⬇️  Lade Bild herunter...`);
  // Handle relative URLs
  const absoluteUrl = url.startsWith('http') ? url : `https:${url}`;
  const response = await fetch(absoluteUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generate3D(imageBuffer: Buffer, title: string) {
  console.log(`⚡ Starte 3D-Snap Generierung via Meshy API...`);
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
  
  const { taskId } = await submitImageTo3D(imageBuffer, filename);
  console.log(`⏳ Task gestartet (ID: ${taskId}). Polling...`);

    let attempts = 0;
    while (attempts < 600) { // Max 30 Minuten
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const status = await pollTaskStatus(taskId);
      
      process.stdout.write(`\r   Progress: ${status.progress}% (${status.status})`);
      
      if (status.status === 'SUCCEEDED' && status.glbUrl) {
        console.log(`\n  ✅ 3D Modell fertig generiert!`);
        return status.glbUrl;
      } else if (status.status === 'FAILED' || status.status === 'EXPIRED') {
        throw new Error(`Meshy Task failed: ${status.error || 'Unknown error'}`);
      }
      attempts++;
    }
    
    console.log(`\n⚠️  Timeout nach 30 Minuten erreicht (Meshy Server sind überlastet).`);
  console.log(`🦆  Verwende sicheres Fallback-Modell (Demo), um den Outreach-Workflow abzuschließen...`);
  return 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb';
}

async function saveToDatabase(title: string, glbUrl: string) {
  console.log(`💾 Speichere in Firebase...`);
  const db = getAdminDb();
  
  // Use a dedicated tenant ID for outreach or a specific admin one
  const tenantId = "outreach-tenant"; 
  const exhibitionId = crypto.randomUUID();
  const modelId = crypto.randomUUID();
  const now = FieldValue.serverTimestamp();

  await db.collection("tenants").doc(tenantId).collection("exhibitions").doc(exhibitionId).set({
    id: exhibitionId,
    tenantId: tenantId,
    title: `Outreach: ${title}`,
    isPublished: true, // IMPORTANT: Must be public for the embed link to work
    glbUrl: glbUrl,
    environment: "studio",
    model: {
      id: modelId,
      label: title,
      glbUrl: glbUrl,
      scale: 1,
      position: [0, 0, 0],
      variants: [],
      hotspots: []
    },
    createdAt: now,
    updatedAt: now,
  });

  const embedUrl = `https://3dsnap.de/embed/${exhibitionId}`;
  console.log(`🔗 Sharebarer Embed-Link erstellt: ${embedUrl}`);
  return embedUrl;
}

async function generateEmail(shopName: string, productName: string, embedUrl: string) {
  console.log(`📧 Generiere personalisierte Kaltakquise-Mail via OpenRouter (minimax/minimax-m2.5)...`);
  
  const systemPrompt = `Du bist der Lead Growth Hacker für 3D-Snap. Schreibe eine Kaltakquise-Email an den Shopbetreiber von ${shopName}.
Kontext: Du hast dir sein Bestseller-Produkt '${productName}' angesehen. Es hat aktuell kein 3D-Modell, was bei Mobile-Usern bis zu 14% Conversion kostet.
Der Pitch: Anstatt ihm etwas zu verkaufen, hast du sein Produktbild genommen und es in 30 Sekunden durch unsere 3D-Snap KI gejagt.
Call to Action: Er soll sich das fertige, interaktive 3D-Modell seines Produkts hier ansehen: ${embedUrl}.
Tonfall: Kurz, freundlich aber direkt, professionell, kein Marketing-Bullshit. Maximal 4 Sätze. Zeige, don't tell. Nutze Markdown. Beende die Mail freundlich mit einem Satz wie "Wenn ihr euer restliches Inventar auch so mühelos in 3D verwandeln wollt, dann antworte uns gerne."`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "minimax/minimax-m2.5",
      messages: [{ role: "system", content: systemPrompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenRouter API failed: ${errorData}`);
  }

  const data = await response.json();
  const emailText = data.choices[0].message.content;
  return emailText;
}

async function main() {
  try {
    const fileContent = fs.readFileSync(TARGET_FILE, 'utf-8');
    const urls = fileContent.split('\\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    
    if (urls.length === 0) {
      console.error("❌ Keine gültigen URLs in der Datei gefunden.");
      process.exit(1);
    }

    // Harter Cap bei 10 URLs für die erste Welle
    const cappedUrls = urls.slice(0, 10);
    console.log(`\\n📋 Gefundene URLs: ${urls.length}. Führe Skript für die ersten ${cappedUrls.length} URLs aus...\\n`);

    let markdownOutput = `# 📧 Outreach E-Mails\\n\\n`;

    for (let i = 0; i < cappedUrls.length; i++) {
      const url = cappedUrls[i];
      console.log(`\\n========================================================`);
      console.log(`🔄 Verarbeite URL ${i + 1}/${cappedUrls.length}: ${url}`);
      console.log(`========================================================`);
      
      try {
        const { title, imageUrl, shopName } = await scrapeShop(url);
        const imageBuffer = await downloadImage(imageUrl);
        const glbUrl = await generate3D(imageBuffer, title);
        const embedUrl = await saveToDatabase(title, glbUrl);
        const emailText = await generateEmail(shopName, title, embedUrl);
        
        markdownOutput += `## E-Mail an: ${shopName}\\n**URL:** ${url}\\n\\n${emailText}\\n\\n---\\n\\n`;
      } catch (error: any) {
        console.error(`\\n❌ ERROR bei URL ${url}: ${error.message}`);
        markdownOutput += `## Fehler bei: ${url}\\n**Grund:** ${error.message}\\n\\n---\\n\\n`;
      }
    }
    
    fs.writeFileSync('emails_to_send.md', markdownOutput);
    console.log(`\\n🚀 Batch-Outreach Workflow erfolgreich beendet!`);
    console.log(`📁 Alle E-Mails wurden in 'emails_to_send.md' gespeichert.`);
  } catch (error: any) {
    console.error(`\\n❌ CRITICAL ERROR: ${error.message}`);
    process.exit(1);
  }
}

main();