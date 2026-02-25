export interface MeshyTask {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  progress: number;
  model_urls?: { glb: string; fbx: string; obj: string };
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

function getMeshyApiKey(): string {
  const raw = process.env.MESHY_API_KEY?.trim();
  if (!raw) {
    throw new Error("Missing MESHY_API_KEY environment variable.");
  }

  // Support comma-separated keys — use the first valid one
  const apiKey = raw.split(",")[0].trim();
  if (apiKey.length === 0) {
    throw new Error("MESHY_API_KEY is empty after parsing.");
  }

  return apiKey;
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
    const formData = new FormData();
    const safeFilename = filename.trim().length > 0 ? filename : "upload-image";

    const imageBytes = Uint8Array.from(imageBuffer);
    formData.set("image", new Blob([imageBytes]), safeFilename);
    formData.set("enable_pbr", "true");
    formData.set("topology", "quad");

    const response = await fetch(MESHY_IMAGE_TO_3D_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getMeshyApiKey()}`,
      },
      body: formData,
    });

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw formatMeshyError("Meshy image-to-3d submission failed", response.status, payload);
    }

    if (!isRecord(payload) || typeof payload.result !== "string" || payload.result.length === 0) {
      throw new Error("Meshy API did not return a valid task id.");
    }

    return { taskId: payload.result };
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
          Authorization: `Bearer ${getMeshyApiKey()}`,
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
      error: task.error,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to poll Meshy task status: ${error.message}`);
    }
    throw new Error("Failed to poll Meshy task status: Unknown error.");
  }
}
