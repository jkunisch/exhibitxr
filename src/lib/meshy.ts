export interface MeshyTask {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  progress: number;
  model_urls?: { glb: string; fbx: string; obj: string; usdz?: string };
  texture_urls?: string[];
  error?: string;
}

export interface GenerateResult {
  taskId: string;
}

export interface PollResult {
  status: MeshyTask["status"];
  progress: number;
  glbUrl?: string;
  usdzUrl?: string;
  error?: string;
}

const MESHY_IMAGE_TO_3D_ENDPOINT = "https://api.meshy.ai/openapi/v1/image-to-3d";
const TASK_STATUSES: readonly MeshyTask["status"][] = [
  "PENDING",
  "IN_PROGRESS",
  "SUCCEEDED",
  "FAILED",
  "EXPIRED",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ─── API Key Management ─────────────────────────────────────────────────────
// Supports comma-separated keys in MESHY_API_KEY env var.
// Rotates round-robin for NEW tasks, but polls always use the same key
// that created the task (Meshy tasks are scoped to their creator key).

let meshyKeyIndex = 0;
let meshyKeys: string[] | null = null;
const taskKeyMap = new Map<string, string>();

function loadMeshyKeys(): string[] {
  if (meshyKeys !== null) return meshyKeys;

  const raw = process.env.MESHY_API_KEY?.trim();
  if (!raw) {
    throw new Error("Missing MESHY_API_KEY environment variable.");
  }

  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (keys.length === 0) {
    throw new Error("MESHY_API_KEY contains no valid keys.");
  }

  meshyKeys = keys;
  return keys;
}

/** Get next key (round-robin) for NEW task submissions. */
function getNextMeshyApiKey(): string {
  const keys = loadMeshyKeys();
  const key = keys[meshyKeyIndex % keys.length];
  meshyKeyIndex = (meshyKeyIndex + 1) % keys.length;
  return key;
}

/** Get the key that was used to create a specific task. Falls back to first key. */
function getMeshyApiKeyForTask(taskId: string): string {
  const saved = taskKeyMap.get(taskId);
  if (saved) return saved;
  // Fallback: if we don't know which key created it, use the first one
  return loadMeshyKeys()[0];
}

function parseMeshyStatus(value: unknown): MeshyTask["status"] {
  if (typeof value === "string" && TASK_STATUSES.includes(value as MeshyTask["status"])) {
    return value as MeshyTask["status"];
  }

  throw new Error("Meshy API returned an unknown task status.");
}

function parseProgress(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (!isRecord(payload)) {
    return undefined;
  }

  const error = payload.error;
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  const message = payload.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  const detail = payload.detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  return undefined;
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function extractTaskPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  if (!("result" in payload)) {
    return payload;
  }

  const result = payload.result;
  if (isRecord(result)) {
    return result;
  }

  return payload;
}

function parseTask(taskPayload: unknown, fallbackTaskId: string): MeshyTask {
  if (!isRecord(taskPayload)) {
    throw new Error("Meshy API returned an invalid task payload.");
  }

  const taskId =
    typeof taskPayload.id === "string" && taskPayload.id.trim().length > 0
      ? taskPayload.id
      : fallbackTaskId;

  const modelUrlsRaw = taskPayload.model_urls;
  const modelUrls = isRecord(modelUrlsRaw)
    ? {
      glb: typeof modelUrlsRaw.glb === "string" ? modelUrlsRaw.glb : "",
      fbx: typeof modelUrlsRaw.fbx === "string" ? modelUrlsRaw.fbx : "",
      obj: typeof modelUrlsRaw.obj === "string" ? modelUrlsRaw.obj : "",
      usdz: typeof modelUrlsRaw.usdz === "string" && modelUrlsRaw.usdz.length > 0
        ? modelUrlsRaw.usdz
        : undefined,
    }
    : undefined;

  const textureUrlsRaw = taskPayload.texture_urls;
  const textureUrls = Array.isArray(textureUrlsRaw)
    ? textureUrlsRaw.filter((value): value is string => typeof value === "string")
    : undefined;

  const error =
    typeof taskPayload.error === "string" && taskPayload.error.trim().length > 0
      ? taskPayload.error
      : undefined;

  return {
    id: taskId,
    status: parseMeshyStatus(taskPayload.status),
    progress: parseProgress(taskPayload.progress),
    model_urls: modelUrls,
    texture_urls: textureUrls,
    error,
  };
}

function formatMeshyError(prefix: string, status: number, payload: unknown): Error {
  const details = extractErrorMessage(payload) ?? "Unknown API error.";
  return new Error(`${prefix} (${status}): ${details}`);
}

export async function submitImageTo3D(
  imageBuffer: Buffer,
  filename: string,
): Promise<GenerateResult> {
  try {
    // Detect MIME type from filename extension, default to jpeg
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
    };
    const mimeType = mimeMap[ext] ?? "image/jpeg";

    // Meshy v1 API expects JSON body with a base64 data URI
    const base64 = imageBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    const body = JSON.stringify({
      image_url: dataUri,
      enable_pbr: true,
      topology: "quad",
    });

    const keys = loadMeshyKeys();
    let lastError: Error | null = null;
    let successfulTaskId = "";
    let successfulApiKey = "";

    for (let i = 0; i < keys.length; i++) {
      const apiKey = getNextMeshyApiKey();

      const response = await fetch(MESHY_IMAGE_TO_3D_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
      });

      const payload = await parseResponsePayload(response);

      if (!response.ok) {
        lastError = formatMeshyError("Meshy image-to-3d submission failed", response.status, payload);
        if (response.status === 401 || response.status === 402 || response.status === 429) {
          console.warn(`[Meshy] Key failed with status ${response.status}. Rotating...`);
          continue;
        }
        throw lastError;
      }

      if (!isRecord(payload) || typeof payload.result !== "string" || payload.result.length === 0) {
        throw new Error("Meshy API did not return a valid task id.");
      }

      successfulTaskId = payload.result;
      successfulApiKey = apiKey;
      break;
    }

    if (!successfulTaskId) {
      throw lastError || new Error("All Meshy API keys failed.");
    }

    // Track which key created this task so polling uses the same one
    taskKeyMap.set(successfulTaskId, successfulApiKey);

    return { taskId: successfulTaskId };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to submit image to Meshy: ${error.message}`);
    }
    throw new Error("Failed to submit image to Meshy: Unknown error.");
  }
}

export async function pollTaskStatus(taskId: string): Promise<PollResult> {
  try {
    if (taskId.trim().length === 0) {
      throw new Error("Missing task id for Meshy polling.");
    }

    const response = await fetch(
      `${MESHY_IMAGE_TO_3D_ENDPOINT}/${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getMeshyApiKeyForTask(taskId)}`,
        },
      },
    );

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw formatMeshyError("Meshy task polling failed", response.status, payload);
    }

    const task = parseTask(extractTaskPayload(payload), taskId);

    return {
      status: task.status,
      progress: task.progress,
      glbUrl: task.model_urls?.glb || undefined,
      usdzUrl: task.model_urls?.usdz || undefined,
      error: task.error,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to poll Meshy task status: ${error.message}`);
    }
    throw new Error("Failed to poll Meshy task status: Unknown error.");
  }
}
