import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load .env.local variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/firebaseAdmin';
import { generateTikTokCreative } from '../src/lib/groq';
import { generateVeoVideo } from '../src/lib/veo';
import { postToTikTok } from '../src/lib/tiktok';
import { chromium } from '@playwright/test';

/**
 * FULL CINEMATIC TIKTOK PIPELINE:
 * 1. Fetch recent UGC (User Generated Content) from Firestore.
 * 2. Generate Creative (Caption, Vibe, Music Choice) via Groq.
 * 3. Capture a high-quality 3D snapshot via Playwright.
 * 4. Transform snapshot into cinematic video via Gemini Veo (GCP Credits).
 * 5. Post to TikTok with Caption & Hashtags.
 */

async function captureSnapshot(modelUrl: string, outputPath: string): Promise<string> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1080, height: 1920 },
        deviceScaleFactor: 2,
    });

    const page = await context.newPage();
    const recordingUrl = `http://localhost:3001/record-tiktok?modelUrl=${encodeURIComponent(modelUrl)}`;
    
    try {
        await page.goto(recordingUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('#model-ready', { timeout: 60000 });
        await page.waitForTimeout(500);
        
        // Take a clean snapshot for Veo (Front view)
        await page.screenshot({ path: outputPath });
        console.log(`📸 Snapshot captured for Veo: ${outputPath}`);
        return outputPath;
    } catch (err: any) {
        console.error(`❌ Snapshot failed: ${err.message}`);
    } finally {
        await browser.close();
    }
    return "";
}

async function runCinematicPipeline() {
    const db = getAdminDb();
    const outputDir = resolve(process.cwd(), './output/tiktok_cinematic');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    console.log("🔍 Fetching recent 3D models for Cinematic Pipeline...");
    
    // Get last published models
    let snapshot = await db.collectionGroup("exhibitions")
        .where("isPublished", "==", true)
        .limit(10)
        .get().catch(() => ({ empty: true, docs: [] }));

    let docs: any[] = [];
    if (snapshot.empty) {
        console.log("ℹ️ No models found in Firestore. Using DEMO model...");
        docs = [{
            id: 'demo-helmet',
            data: () => ({
                title: "Cyberpunk Helmet",
                glbUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            })
        }];
    } else {
        docs = snapshot.docs.sort((a: any, b: any) => {
            const timeA = a.data().createdAt?.seconds || 0;
            const timeB = b.data().createdAt?.seconds || 0;
            return timeB - timeA;
        }).slice(0, 3); // Process only 3 for now (credits/time)
    }

    for (const doc of docs) {
        const data = doc.data();
        const title = data.title || data.model?.label || "Unbekanntes Modell";
        const glbUrl = data.glbUrl || data.model?.glbUrl;

        if (!glbUrl) continue;
        
        console.log(`
========================================================`);
        console.log(`🎬 Cinematic Processing: ${title}`);
        console.log(`========================================================`);

        try {
            // 1. Creative Brief via Groq
            const creative = await generateTikTokCreative(title);
            console.log(`🧠 Creative Brief: "${creative.caption}"`);

            // 2. Snapshot capture via Playwright
            const snapshotPath = resolve(outputDir, `snap_${doc.id}.png`);
            await captureSnapshot(glbUrl, snapshotPath);
            
            // 3. Cinematic Transformation via Gemini Veo (GCP Credits)
            const prompt = `Cinematic video orbit around this ${title}, high quality textures, professional lighting, ${creative.vibe} atmosphere.`;
            const videoResult = await generateVeoVideo(snapshotPath, prompt, outputDir);
            
            // 4. Save Metadata
            const metaPath = resolve(outputDir, `tiktok_${doc.id}.json`);
            fs.writeFileSync(metaPath, JSON.stringify({ ...creative, exhibitionId: doc.id, veoResponse: videoResult }, null, 2));
            console.log(`📄 Cinematic metadata saved: ${metaPath}`);

            // 5. TikTok Posting (Requires TIKTOK_ACCESS_TOKEN in .env.local)
            const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
            if (accessToken) {
                // await postToTikTok(videoPath, creative.caption, creative.hashtags, accessToken);
            } else {
                console.log("ℹ️ TikTok access token missing. Skipping post.");
            }

        } catch (err: any) {
            console.error(`❌ Error in cinematic pipeline for ${title}: ${err.message}`);
        }
    }

    console.log("\n🚀 Cinematic Pipeline run complete.");
}

runCinematicPipeline().catch(console.error);
