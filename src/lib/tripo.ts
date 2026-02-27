/**
 * Tripo AI — Image-to-3D API client.
 *
 * Mirrors the interface from `@/lib/meshy` (GenerateResult, PollResult)
 * so we can swap providers transparently.
 *
 * API docs: https://api.tripo3d.ai/v2/openapi/task
 */

import type { GenerateResult, PollResult } from "./meshy";

const TRIPO_API_BASE = "https://api.tripo3d.ai/v2/openapi";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Supports comma-separated keys in TRIPO_API_KEY env var (round-robin).
let tripoKeyIndex = 0;

function getTripoApiKey(): string {
    const raw = process.env.TRIPO_API_KEY?.trim();
    if (!raw) {
        throw new Error("Missing TRIPO_API_KEY environment variable.");
    }
    const keys = raw.split(",").map((k) => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        throw new Error("TRIPO_API_KEY contains no valid keys.");
    }
    const key = keys[tripoKeyIndex % keys.length]!;
    tripoKeyIndex = (tripoKeyIndex + 1) % keys.length;
    return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

async function tripoFetch(
    path: string,
    options: RequestInit = {},
): Promise<unknown> {
    const url = `${TRIPO_API_BASE}${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${getTripoApiKey()}`,
            ...options.headers,
        },
    });

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    let payload: unknown = null;

    if (contentType.includes("application/json")) {
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }
    } else {
        try {
            payload = await response.text();
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        const detail = isRecord(payload)
            ? (payload.message ?? payload.error ?? payload.detail ?? "Unknown error")
            : payload;
        throw new Error(
            `Tripo API error (${response.status}): ${String(detail)}`,
        );
    }

    return payload;
}

// ─── Task status mapping ────────────────────────────────────────────────────

type TripoStatus = "queued" | "running" | "success" | "failed" | "cancelled" | "unknown";

function mapTripoStatus(
    raw: unknown,
): PollResult["status"] {
    const s = String(raw).toLowerCase();
    if (s === "success") return "SUCCEEDED";
    if (s === "failed" || s === "cancelled") return "FAILED";
    if (s === "queued" || s === "running") return "IN_PROGRESS";
    return "IN_PROGRESS"; // treat unknown as in-progress
}

function parseTripoProgress(status: unknown, progress: unknown): number {
    // Tripo returns progress as 0-100 number
    if (typeof progress === "number" && Number.isFinite(progress)) {
        return Math.round(progress);
    }
    // Fallback based on status
    const s = String(status).toLowerCase();
    if (s === "queued") return 5;
    if (s === "running") return 50;
    if (s === "success") return 100;
    return 0;
}

// ─── Public API (matches meshy.ts interface) ────────────────────────────────

/**
 * Submit an image to Tripo for 3D generation.
 * Returns a task ID for polling.
 */
export async function submitImageToTripo(
    imageBuffer: Buffer,
    filename: string,
): Promise<GenerateResult> {
    try {
        // Step 1: Upload the image to get a file token
        const uploadForm = new FormData();
        const safeFilename = filename.trim().length > 0 ? filename : "upload-image";
        const imageBytes = Uint8Array.from(imageBuffer);
        uploadForm.set("file", new Blob([imageBytes]), safeFilename);

        const uploadResult = await tripoFetch("/upload", {
            method: "POST",
            body: uploadForm,
        });

        if (!isRecord(uploadResult) || !isRecord(uploadResult.data)) {
            throw new Error("Tripo upload did not return valid data.");
        }

        const imageToken = (uploadResult.data as Record<string, unknown>).image_token;
        if (typeof imageToken !== "string" || imageToken.length === 0) {
            throw new Error("Tripo upload did not return an image token.");
        }

        // Step 2: Create the image-to-3D task
        const taskResult = await tripoFetch("/task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "image_to_model",
                file: { type: "image", file_token: imageToken },
            }),
        });

        if (!isRecord(taskResult) || !isRecord(taskResult.data)) {
            throw new Error("Tripo task creation did not return valid data.");
        }

        const taskId = (taskResult.data as Record<string, unknown>).task_id;
        if (typeof taskId !== "string" || taskId.length === 0) {
            throw new Error("Tripo did not return a valid task_id.");
        }

        return { taskId };
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to submit image to Tripo: ${error.message}`);
        }
        throw new Error("Failed to submit image to Tripo: Unknown error.");
    }
}

/**
 * Poll a Tripo task for its current status.
 */
export async function pollTripoTaskStatus(
    taskId: string,
): Promise<PollResult> {
    try {
        if (taskId.trim().length === 0) {
            throw new Error("Missing task id for Tripo polling.");
        }

        const result = await tripoFetch(`/task/${encodeURIComponent(taskId)}`, {
            method: "GET",
        });

        if (!isRecord(result) || !isRecord(result.data)) {
            throw new Error("Tripo polling returned invalid data.");
        }

        const data = result.data as Record<string, unknown>;
        const status = mapTripoStatus(data.status);
        const progress = parseTripoProgress(data.status, data.progress);

        // Extract GLB URL from output — Tripo returns either direct strings
        // or objects like {type: "glb", url: "..."} for model/pbr_model
        let glbUrl: string | undefined;
        if (isRecord(data.output)) {
            const output = data.output as Record<string, unknown>;

            // Try pbr_model first (higher quality PBR output)
            const pbr = output.pbr_model;
            if (typeof pbr === "string" && pbr.length > 0) {
                glbUrl = pbr;
            } else if (isRecord(pbr) && typeof (pbr as Record<string, unknown>).url === "string") {
                glbUrl = (pbr as Record<string, unknown>).url as string;
            }

            // Fallback to model
            if (!glbUrl) {
                const model = output.model;
                if (typeof model === "string" && model.length > 0) {
                    glbUrl = model;
                } else if (isRecord(model) && typeof (model as Record<string, unknown>).url === "string") {
                    glbUrl = (model as Record<string, unknown>).url as string;
                }
            }
        }

        const error = typeof data.error === "string" && data.error.length > 0
            ? data.error
            : undefined;

        return { status, progress, glbUrl, error };
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to poll Tripo task: ${error.message}`);
        }
        throw new Error("Failed to poll Tripo task: Unknown error.");
    }
}

// ─── USDZ Conversion via Tripo convert_model ────────────────────────────────

/** Maximum time (ms) to wait for USDZ conversion before giving up. */
const USDZ_CONVERSION_TIMEOUT_MS = 120_000;
/** Poll interval (ms) between conversion status checks. */
const USDZ_POLL_INTERVAL_MS = 3_000;

/**
 * Poll a Tripo conversion task until it completes or times out.
 * Returns the USDZ download URL on success.
 */
async function pollTripoConversion(
    conversionTaskId: string,
    timeoutMs: number = USDZ_CONVERSION_TIMEOUT_MS,
): Promise<string> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const result = await tripoFetch(
            `/task/${encodeURIComponent(conversionTaskId)}`,
            { method: "GET" },
        );

        if (!isRecord(result) || !isRecord(result.data)) {
            throw new Error("Tripo USDZ conversion poll returned invalid data.");
        }

        const data = result.data as Record<string, unknown>;
        const status = String(data.status).toLowerCase();

        if (status === "success") {
            // Extract USDZ URL from output
            if (isRecord(data.output)) {
                const output = data.output as Record<string, unknown>;
                // Tripo convert_model puts the result in output.model
                const model = output.model;
                if (typeof model === "string" && model.length > 0) {
                    return model;
                }
                if (isRecord(model) && typeof (model as Record<string, unknown>).url === "string") {
                    return (model as Record<string, unknown>).url as string;
                }
            }
            throw new Error("Tripo USDZ conversion succeeded but no download URL found in output.");
        }

        if (status === "failed" || status === "cancelled") {
            const errorMsg = typeof data.error === "string" ? data.error : "Unknown conversion error";
            throw new Error(`Tripo USDZ conversion failed: ${errorMsg}`);
        }

        // Still running — wait before next poll
        await new Promise((resolve) => setTimeout(resolve, USDZ_POLL_INTERVAL_MS));
    }

    throw new Error(`Tripo USDZ conversion timed out after ${timeoutMs / 1000}s.`);
}

/**
 * Convert an existing Tripo 3D task output to USDZ format.
 *
 * Uses Tripo's `convert_model` task type:
 * - Creates a new task with `type: "convert_model"` and `format: "USDZ"`
 * - Polls until the conversion completes
 * - Returns the USDZ download URL
 *
 * @param originalTaskId - The task_id of the original image_to_model task
 * @returns Download URL for the USDZ file
 */
export async function convertTripoToUsdz(
    originalTaskId: string,
): Promise<string> {
    if (originalTaskId.trim().length === 0) {
        throw new Error("Missing original task ID for Tripo USDZ conversion.");
    }

    console.log(`[Tripo] Starting USDZ conversion for task ${originalTaskId}`);

    // Step 1: Create the conversion task
    const conversionResult = await tripoFetch("/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "convert_model",
            format: "USDZ",
            original_model_task_id: originalTaskId,
        }),
    });

    if (!isRecord(conversionResult) || !isRecord(conversionResult.data)) {
        throw new Error("Tripo USDZ conversion task creation returned invalid data.");
    }

    const conversionTaskId = (conversionResult.data as Record<string, unknown>).task_id;
    if (typeof conversionTaskId !== "string" || conversionTaskId.length === 0) {
        throw new Error("Tripo did not return a valid conversion task_id.");
    }

    console.log(`[Tripo] USDZ conversion task created: ${conversionTaskId}`);

    // Step 2: Poll until conversion completes
    const usdzUrl = await pollTripoConversion(conversionTaskId);
    console.log(`[Tripo] USDZ conversion complete: ${usdzUrl.substring(0, 80)}...`);

    return usdzUrl;
}
