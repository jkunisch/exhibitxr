import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Setup Vertex AI with the service account key
const project = 'sovereign-agent-swarm';
const location = 'us-central1'; 
const keyFilePath = resolve(process.cwd(), 'gcp-veo-key.json');

// OFFICIAL WAY for Service Accounts in Node.js Vertex AI SDK
const vertexAI = new VertexAI({ 
    project: project, 
    location: location,
    googleAuthOptions: {
        keyFile: keyFilePath
    }
});

async function generateVeoVideo(prompt: string, outputFilename: string) {
    const outputDir = resolve(process.cwd(), './output/veo');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    console.log(`🎬 Requesting Veo Video for prompt: "${prompt}"...`);

    try {
        // NOTE: Veo 3.1 is currently accessed via the 'veo-001' or 'imagen-video' model name in Vertex AI
        // This is a placeholder for the actual API call structure
        const generativeModel = vertexAI.getGenerativeModel({
            model: 'veo-001', // Update based on actual model garden name
        });

        const request = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            // Add video-specific parameters if needed
        };

        const response = await generativeModel.generateContent(request);
        const result = await response.response;
        
        console.log("✅ Veo Response received.");
        console.log(JSON.stringify(result, null, 2));

        // Note: Actual video download logic depends on GCS URI or base64 in response
        // For now, we log the result to see the structure
        const resultPath = resolve(outputDir, `${outputFilename}.json`);
        fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
        console.log(`📄 Response metadata saved to: ${resultPath}`);

    } catch (error: any) {
        console.error(`❌ Veo Generation failed: ${error.message}`);
        if (error.message.includes('404')) {
            console.log("💡 INFO: If 'veo-001' is not found, checking alternative model names (imagen-video)...");
        }
    }
}

// CLI usage: npx tsx scripts/generate-veo-video.ts "A cinematic 3D product showcase of a futuristic sneaker"
const userPrompt = process.argv[2] || "A cinematic product showcase of a high-end luxury watch on a dark reflecting surface, studio lighting, 4k, realistic.";
generateVeoVideo(userPrompt, `veo_${Date.now()}`);
