/**
 * "Veo Ad Factory" prompt orchestrator.
 *
 * - Uses an LLM (recommended: Gemini via Google Gen AI SDK) to create:
 *   1) Veo prompt w/ timestamp pacing
 *   2) negativePrompt
 *   3) TikTok caption + hashtags
 *   4) edit plan overlay text (hook + CTA)
 *
 * Reliability:
 * - Strict Zod validation.
 * - JSON extraction fallback if model returns extra text.
 * - Optional auto-repair attempt (one retry) if schema validation fails.
 *
 * Notes:
 * - Google recommends the Google Gen AI SDK (@google/genai). It supports structured output
 *   via responseMimeType/responseSchema when using Vertex AI mode (ADC + project/location).
 */

import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";

export const VEO_AD_FACTORY_MASTER_PROMPT = `<veo_master_prompt>
You are “Veo Ad Factory”: an expert prompt engineer and short-form performance-ad creative director.
When given a Product + Hook, immediately output:
1) A photorealistic English Veo prompt (vertical 9:16, 1080p, 24fps, duration: 8s, generateAudio: false). MUST use timestamp prompting (e.g., [00:00-00:02], [00:02-00:04]). Must include clear cinematography, subject, action, context, and style. NO on-screen text in the prompt.
2) A Universal strict negativePrompt string.
3) A CapCut/FFmpeg edit instruction: Hook overlay text (0.0-2.0s) and CTA screen text (6.0-8.0s) keeping words punchy (3-6 words).
</veo_master_prompt>`;

export interface ProductContext {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly glbUrl: string;

  /**
   * Optional: a precomputed hook from your system.
   * If omitted, the model should create one.
   */
  readonly hook?: string;
}

/** Enforce 3-6 words, punchy TikTok overlays. */
function wordCount(s: string): number {
  return s
    .trim()
    .split(/\s+/g)
    .filter((w) => w.length > 0).length;
}

export const AdSpecSchema = z.object({
  veoPrompt: z
    .string()
    .min(40)
    .refine((s) => /\[00:00-00:0[1-9]\]/.test(s) || /\[00:00-00:02\]/.test(s), {
      message: "veoPrompt must include timestamp prompting like [00:00-00:02].",
    }),
  negativePrompt: z.string().min(10),

  tiktok: z.object({
    caption: z.string().min(1).max(2200),
    hashtags: z
      .array(z.string().min(2))
      .min(3)
      .max(20)
      .transform((tags) =>
        tags.map((t) => (t.startsWith("#") ? t : `#${t.replace(/^#+/, "")}`)),
      ),
  }),

  editPlan: z.object({
    hookText: z
      .string()
      .min(1)
      .max(80)
      .refine((s) => wordCount(s) >= 1 && wordCount(s) <= 10, { message: "hookText must be 1-10 words." }),
    ctaText: z
      .string()
      .min(1)
      .max(80)
      .refine((s) => wordCount(s) >= 1 && wordCount(s) <= 10, { message: "ctaText must be 1-10 words." }),
  }),
});

export type AdSpec = z.infer<typeof AdSpecSchema>;

export interface AdFactoryOptions {
  readonly projectId: string;
  /** Use 'global' for Gemini; your Veo region can be different. */
  readonly location?: string;
  /** Recommended fast/cheap model for structured JSON: gemini-2.5-flash */
  readonly model?: string;
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
}

/**
 * Very small JSON extraction helper:
 * - Try direct JSON.parse
 * - Else extract first {...} block
 */
function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    // Attempt to find the first top-level JSON object substring.
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as unknown;
      } catch {
        // fallthrough
      }
    }
    return undefined;
  }
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export class AdFactory {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;

  constructor(opts: AdFactoryOptions) {
    const location = opts.location ?? "global";
    this.client = new GoogleGenAI({
      project: opts.projectId,
      location,
      vertexai: true,
    });

    this.model = opts.model ?? "gemini-2.5-flash";
    this.temperature = opts.temperature ?? 0.7;
    this.maxOutputTokens = opts.maxOutputTokens ?? 1200;
  }

  private buildPrompt(product: ProductContext): string {
    const hook = product.hook?.trim();

    const hookLine = hook && hook.length > 0
      ? `Hook: ${hook}`
      : "Hook: (Invent a high-performing hook based on the product. Do NOT ask questions.)";

    return [
      VEO_AD_FACTORY_MASTER_PROMPT,
      "",
      "You MUST output ONLY valid JSON matching the required schema. No markdown, no commentary.",
      "",
      "Product:",
      `- id: ${product.id}`,
      `- title: ${product.title}`,
      product.description ? `- description: ${product.description}` : "- description: (none)",
      `- glbUrl: ${product.glbUrl}`,
      hookLine,
      "",
      "JSON Schema (informal):",
      "{",
      '  "veoPrompt": string,',
      '  "negativePrompt": string,',
      '  "tiktok": { "caption": string, "hashtags": string[] },',
      '  "editPlan": { "hookText": string, "ctaText": string }',
      "}",
      "",
      "Rules:",
      "- veoPrompt must be English, photorealistic, 9:16 1080p 24fps, 8s, generateAudio:false.",
      "- veoPrompt MUST include timestamp blocks [00:00-00:02], [00:02-00:04], [00:04-00:06], [00:06-00:08].",
      "- veoPrompt must NOT mention any on-screen text.",
      "- negativePrompt must be strict and universal.",
      "- hookText shows 0-2s; ctaText shows 6-8s; both 3-6 words.",
      "- hashtags should be relevant, TikTok-native, no spaces, include #.",
    ].join("\\n");
  }

  /**
   * Response schema for structured output (keeps the model disciplined).
   * We STILL Zod-validate after parsing.
   */
  private readonly responseSchema = {
    type: Type.OBJECT,
    properties: {
      veoPrompt: { type: Type.STRING },
      negativePrompt: { type: Type.STRING },
      tiktok: {
        type: Type.OBJECT,
        properties: {
          caption: { type: Type.STRING },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["caption", "hashtags"],
      },
      editPlan: {
        type: Type.OBJECT,
        properties: {
          hookText: { type: Type.STRING },
          ctaText: { type: Type.STRING },
        },
        required: ["hookText", "ctaText"],
      },
    },
    required: ["veoPrompt", "negativePrompt", "tiktok", "editPlan"],
  } as const;

  public async generateAdSpec(product: ProductContext): Promise<AdSpec> {
    const prompt = this.buildPrompt(product);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema: this.responseSchema,
      },
    });

    const rawText = isNonEmptyString(response.text) ? response.text : "";
    const parsed = extractJsonObject(rawText);

    if (parsed === undefined) {
      console.warn("[AdFactory] Failed to extract JSON. Raw text was:", rawText);
    }

    const validated = AdSpecSchema.safeParse(parsed);
    if (validated.success) return validated.data;

    // One-shot repair: ask the model to output *only* valid JSON matching schema.
    const repairPrompt = [
      "You produced invalid JSON or schema mismatch.",
      "Return ONLY corrected JSON that matches the schema exactly. No extra text.",
      "",
      "Original output:",
      rawText,
      "",
      "Validation errors:",
      JSON.stringify(validated.error.issues, null, 2),
    ].join("\\n");

    const repair = await this.client.models.generateContent({
      model: this.model,
      contents: repairPrompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: this.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema: this.responseSchema,
      },
    });

    const repairText = isNonEmptyString(repair.text) ? repair.text : "";
    const repairParsed = extractJsonObject(repairText);
    const repairedValidated = AdSpecSchema.safeParse(repairParsed);

    if (!repairedValidated.success) {
      throw new Error(
        `AdFactory failed to produce valid JSON after repair. Issues: ${JSON.stringify(
          repairedValidated.error.issues,
        )}`,
      );
    }

    return repairedValidated.data;
  }
}
