import { chromium } from '@playwright/test';
import { resolve } from 'path';
import * as fs from 'fs';

async function generateTikTokVideo(modelUrl: string, outputDir: string = './output/tiktok') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().getTime();
  const outputPath = resolve(outputDir, `snap_${timestamp}`);

  console.log(`🚀 Starting TikTok video generation for model: ${modelUrl}`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--disable-web-security',
      '--use-gl=angle',
      '--use-angle=gl',
      '--disable-gpu-sandbox',
      '--hide-scrollbars'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 }, // TikTok vertical format
    deviceScaleFactor: 2, // High DPI for better quality
    recordVideo: {
      dir: outputDir,
      size: { width: 1080, height: 1920 }
    }
  });

  const page = await context.newPage();
  
  // Use production URL
  const baseUrl = 'https://www.3d-snap.com';
  const recordingUrl = `${baseUrl}/record-tiktok?modelUrl=${encodeURIComponent(modelUrl)}`;
  
  console.log(`🔗 Navigating to recording page: ${recordingUrl}`);
  
  try {
    await page.goto(recordingUrl, { waitUntil: 'networkidle' });
    
    // Wait for the model to load (canvas should be present)
    await page.waitForSelector('canvas', { timeout: 30000 });
    
    // Give it 2 seconds to definitely render
    await page.waitForTimeout(2000);
    
    // TAKE DEBUG SCREENSHOT
    const screenshotPath = `${outputPath}_debug.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Debug screenshot saved: ${screenshotPath}`);

    console.log("🎥 Recording 360° spin (10 seconds)...");
    
    // Record for 10 seconds
    await page.waitForTimeout(10000);
    
    await context.close();
    const videoFile = await page.video()?.path();
    
    if (videoFile) {
        const finalPath = `${outputPath}.webm`;
        fs.renameSync(videoFile, finalPath);
        console.log(`✅ Video generation successful: ${finalPath}`);
    } else {
        console.error("❌ Failed to capture video.");
    }
  } catch (error: any) {
    console.error(`❌ Error during recording: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// CLI usage: npx tsx scripts/generate-tiktok-video.ts <MODEL_URL>
const inputUrl = process.argv[2] || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb';
generateTikTokVideo(inputUrl);
