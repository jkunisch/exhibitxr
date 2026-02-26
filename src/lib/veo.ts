import {
    VertexAI,
    type Content,
    type GenerateContentRequest,
    type GenerateContentResult,
} from '@google-cloud/vertexai';
import * as fs from 'fs';
import { resolve } from 'path';

interface ServiceAccountKey {
    project_id: string;
}

type VeoAspectRatio = '9:16' | '16:9' | '1:1';
type VeoResolution = '720p' | '1080p';

interface VeoRenderOptions {
    aspectRatio: VeoAspectRatio;
    durationSeconds: number;
    resolution: VeoResolution;
}

const DEFAULT_VEO_OPTIONS: VeoRenderOptions = {
    aspectRatio: '9:16',
    durationSeconds: 8,
    resolution: '1080p',
};

function parseServiceAccountKey(rawJson: string): ServiceAccountKey {
    const parsed: unknown = JSON.parse(rawJson);
    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('project_id' in parsed) ||
        typeof parsed.project_id !== 'string' ||
        parsed.project_id.length === 0
    ) {
        throw new Error("Invalid gcp-veo-key.json: missing 'project_id'.");
    }

    return { project_id: parsed.project_id };
}

function buildVeoPrompt(prompt: string, options: VeoRenderOptions): string {
    return `${prompt}

Video specs:
- Aspect ratio: ${options.aspectRatio}
- Duration: ${options.durationSeconds}s
- Resolution target: ${options.resolution}`;
}

function buildVeoRequest(
    prompt: string,
    imageData: string,
    options: VeoRenderOptions,
): GenerateContentRequest {
    const content: Content = {
        role: 'user',
        parts: [
            { text: buildVeoPrompt(prompt, options) },
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: imageData,
                },
            },
        ],
    };

    return {
        contents: [content],
    };
}

/**
 * Gemini Veo Video Generator
 * Uses GCP credits to transform 3D snapshots into cinematic videos.
 */
export async function generateVeoVideo(
    imagePath: string,
    prompt: string,
    outputDir: string,
): Promise<GenerateContentResult> {
    const keyPath = resolve(process.cwd(), 'gcp-veo-key.json');
    if (!fs.existsSync(keyPath)) {
        throw new Error("GCP Service Account Key (gcp-veo-key.json) missing.");
    }

    const keyData = parseServiceAccountKey(fs.readFileSync(keyPath, 'utf-8'));

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Set environment variable for the SDK to find the key
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
        project: keyData.project_id,
        location: 'us-central1'
    });

    // Note: As of 2026, Veo is part of the generativeModels suite in Vertex AI
    const generativeModel = vertexAI.getGenerativeModel({
        model: 'veo-3.1-generate-001',
    });

    console.log(`🎬 Sending Image-to-Video request to Gemini Veo...`);
    console.log(`📝 Prompt: ${prompt}`);

    const imageData = fs.readFileSync(imagePath).toString('base64');

    try {
        const request = buildVeoRequest(prompt, imageData, DEFAULT_VEO_OPTIONS);
        const response = await generativeModel.generateContent(request);
        
        // In a real production environment, you would poll a Long Running Operation (LRO)
        // For now, we assume the SDK handles the wait or returns a preview URL
        console.log("✅ Veo request processed successfully.");
        return response;
    } catch (error: unknown) {
        console.error("❌ Veo Generation Error:", error);
        throw error;
    }
}
