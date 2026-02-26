import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load .env.local variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/firebaseAdmin';
import { generateTikTokCreative } from '../src/lib/groq';
import { postToTikTok } from '../src/lib/tiktok';
import { chromium } from '@playwright/test';

/**
 * FULL TIKTOK PIPELINE:
 * 1. Fetch recent UGC (User Generated Content) from Firestore.
 * 2. Generate Creative (Caption, Vibe, Music Choice) via Groq.
 * 3. Record 360° Spin Video via Playwright.
 * 4. Auto-Post to TikTok using self-healing tokens.
 */

async function recordVideo(modelUrl: string, outputDir: string, filename: string): Promise<string> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1080, height: 1920 },
        deviceScaleFactor: 2,
        recordVideo: {
            dir: outputDir,
            size: { width: 1080, height: 1920 }
        }
    });

    const page = await context.newPage();
    // Use production URL for recording
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.3d-snap.com';
    const recordingUrl = `${baseUrl}/record-tiktok?modelUrl=${encodeURIComponent(modelUrl)}`;
    
    try {
        await page.goto(recordingUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('#model-ready', { timeout: 60000 });
        await page.waitForTimeout(500); // Small buffer for layout stabilization
        console.log("🎥 Recording 10 seconds of 360° spin...");
        await page.waitForTimeout(10000);
        
        await context.close();
        const videoFile = await page.video()?.path();
        if (videoFile) {
            const finalPath = resolve(outputDir, `${filename}.webm`);
            fs.renameSync(videoFile, finalPath);
            return finalPath;
        }
    } catch (err: any) {
        console.error(`❌ Recording failed: ${err.message}`);
    } finally {
        await browser.close();
    }
    return "";
}

async function runPipeline() {
    const db = getAdminDb();
    const outputDir = resolve(process.cwd(), './output/tiktok');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    console.log("🔍 Fetching recent 3D models from Firestore (UGC)...");
    
    // Get published models (index-free query)
    let snapshot = await db.collectionGroup("exhibitions")
        .where("isPublished", "==", true)
        .limit(20)
        .get().catch(() => ({ empty: true, docs: [] }));

    let docs: any[] = [];
    if (snapshot.empty) {
        console.log("ℹ️ No models found in Firestore or query failed (index required). Using DEMO model for testing...");
        docs = [{
            id: 'demo-helmet',
            data: () => ({
                title: "Cyberpunk Helmet",
                glbUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            })
        }];
    } else {
        // Sort in memory by createdAt descending
        docs = snapshot.docs.sort((a, b) => {
            const timeA = a.data().createdAt?.seconds || 0;
            const timeB = b.data().createdAt?.seconds || 0;
            return timeB - timeA;
        }).slice(0, 5);
    }

    for (const doc of docs) {
        const data = doc.data();
        const title = data.title || data.model?.label || "Unbekanntes Modell";
        const glbUrl = data.glbUrl || data.model?.glbUrl;

        if (!glbUrl) continue;
        
        console.log(`\n========================================================`);
        console.log(`🎬 Processing: ${title}`);
        console.log(`========================================================`);

        try {
            // 1. Creative Direction via Groq
            console.log("🧠 Generating Creative Brief via Groq...");
            const creative = await generateTikTokCreative(title);
            console.log(`✨ Caption: "${creative.caption}"`);
            console.log(`🎨 Vibe: ${creative.vibe} | Music: ${creative.musicQuery}`);

            // 2. Video Recording
            const filename = `tiktok_${doc.id}`;
            const videoPath = await recordVideo(glbUrl, outputDir, filename);
            
            if (videoPath) {
                console.log(`✅ Video generated: ${videoPath}`);
                
                // 3. Save Creative Meta
                const metaPath = `${videoPath}.json`;
                fs.writeFileSync(metaPath, JSON.stringify({ ...creative, exhibitionId: doc.id }, null, 2));
                console.log(`📄 Metadata saved: ${metaPath}`);

                // 4. Auto-Post to TikTok (using Self-Healing Tokens)
                try {
                    await postToTikTok(videoPath, creative.caption, creative.hashtags || []);
                } catch (postErr: any) {
                    console.error(`❌ TikTok Auto-Post failed: ${postErr.message}`);
                }
            }

        } catch (err: any) {
            console.error(`❌ Error in pipeline for ${title}: ${err.message}`);
        }
    }

    console.log("\n🚀 Pipeline run complete.");
}

runPipeline().catch(console.error);
