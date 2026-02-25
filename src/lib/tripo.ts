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

function getTripoApiKey(): string {
    const apiKey = process.env.TRIPO_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("Missing TRIPO_API_KEY environment variable.");
    }
    return apiKey;
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

        // Extract GLB URL from output
        let glbUrl: string | undefined;
        if (isRecord(data.output) && typeof (data.output as Record<string, unknown>).model === "string") {
            glbUrl = (data.output as Record<string, unknown>).model as string;
        }
        // Sometimes the rendered_image/pbr_model is used
        if (!glbUrl && isRecord(data.output) && typeof (data.output as Record<string, unknown>).pbr_model === "string") {
            glbUrl = (data.output as Record<string, unknown>).pbr_model as string;
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
