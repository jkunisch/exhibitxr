import { GoogleAuth } from "google-auth-library";
import { Storage } from "@google-cloud/storage";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export type VeoAspectRatio = "9:16" | "16:9";
export type VeoResolution = "720p" | "1080p" | "4k";
export type VeoPersonGeneration = "dont_allow" | "allow_adult";
export type VeoReferenceType = "asset" | "style";

/**
 * Image payload accepted by Veo:
 * - bytesBase64Encoded for inline transfer (small images)
 * - gcsUri for Cloud Storage reference
 */
export type VeoImage =
  | Readonly<{ mimeType: string; bytesBase64Encoded: string; gcsUri?: never }>
  | Readonly<{ mimeType: string; gcsUri: string; bytesBase64Encoded?: never }>;

export interface VeoReferenceImage {
  /** "asset" to preserve product identity; "style" for style transfer (model-dependent). */
  readonly referenceType?: VeoReferenceType;
  readonly image: VeoImage;
}

export interface VeoGenerateRequest {
  /** Photorealistic prompt. Must NOT contain on-screen text instructions. */
  readonly prompt: string;
  /** Universal negative prompt to reduce artifacts. */
  readonly negativePrompt?: string;

  /** Optional: reference images for identity/style consistency. */
  readonly referenceImages?: readonly VeoReferenceImage[];

  /** Optional: image-to-video first frame. */
  readonly image?: VeoImage;

  /** Output controls */
  readonly aspectRatio?: VeoAspectRatio; // "9:16" for TikTok
  readonly resolution?: VeoResolution; // "1080p"
  readonly generateAudio?: boolean; // false in your pipeline

  /** Safety / people */
  readonly personGeneration?: VeoPersonGeneration;

  /** Sampling */
  readonly sampleCount?: number; // typically 1 (cost control)
  readonly seed?: number;

  /**
   * Where Veo should write outputs in GCS.
   * Must be a GCS URI prefix like gs://bucket/path/ (trailing slash recommended).
   * If omitted, Veo may return base64 in the response (less ideal for large videos).
   */
  readonly outputGcsUri?: string;

  /**
   * If true, and the request fails due to referenceImages, the client will retry
   * by converting the first reference image into image-to-video seed `image`.
   */
  readonly fallbackToImageToVideoOnReferenceRejection?: boolean;
}

export interface VeoVideo {
  readonly gcsUri?: string;
  readonly bytesBase64Encoded?: string;
  readonly mimeType?: string;
}

export interface VeoCompletedResult {
  readonly operationName: string;
  readonly videos: readonly VeoVideo[];
  readonly raiMediaFilteredCount?: number;
}

export interface VeoDownloadResult extends VeoCompletedResult {
  /** Local file paths written to disk (one per sample). */
  readonly localPaths: readonly string[];
  /** GCS URIs returned by the model (may be empty if base64 mode). */
  readonly gcsUris: readonly string[];
}

export interface VertexVeoClientOptions {
  readonly projectId: string;
  readonly location: string; // e.g. "us-central1"
  readonly modelId: string; // e.g. "veo-3.1-fast-generate-001"
  readonly keyFilename?: string; // Optional custom service account JSON path

  readonly poll?: Readonly<{
    /** Total wall-clock timeout for polling. */
    timeoutMs?: number;
    /** Initial delay before first poll. */
    initialDelayMs?: number;
    /** Max delay between polls. */
    maxDelayMs?: number;
    /** Jitter ratio (e.g. 0.1 for +/- 10%). */
    jitterRatio?: number;
  }>;
}

class VertexVeoClientError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "VertexVeoClientError";
  }
}

class VertexVeoOperationError extends Error {
  constructor(message: string, public readonly operationName: string, public readonly rawError: unknown) {
    super(message);
    this.name = "VertexVeoOperationError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withJitter(ms: number, ratio: number): number {
  const diff = ms * ratio;
  return Math.max(0, ms + (Math.random() * 2 - 1) * diff);
}

function ensureTrailingSlash(uri: string): string {
  return uri.endsWith("/") ? uri : `${uri}/`;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const v = record[key];
  return typeof v === "string" ? v : undefined;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const v = record[key];
  return typeof v === "boolean" ? v : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const v = record[key];
  return typeof v === "number" ? v : undefined;
}

function parseGsUri(uri: string): { bucket: string; object: string } {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (!match || match.length < 3 || !match[1] || !match[2]) {
    throw new VertexVeoClientError(`Invalid GCS URI format: ${uri}`);
  }
  return { bucket: match[1], object: match[2] };
}

export class VertexVeoClient {
  private readonly projectId: string;
  private readonly location: string;
  private readonly host: string;
  private readonly modelBasePath: string;
  private readonly auth: GoogleAuth;
  private readonly storage: Storage;

  private readonly pollTimeoutMs: number;
  private readonly pollInitialDelayMs: number;
  private readonly pollMaxDelayMs: number;
  private readonly pollJitterRatio: number;

  constructor(opts: VertexVeoClientOptions) {
    this.projectId = opts.projectId;
    this.location = opts.location;
    this.host = `${this.location}-aiplatform.googleapis.com`;
    this.modelBasePath = `/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${opts.modelId}`;

    this.pollTimeoutMs = opts.poll?.timeoutMs ?? 15 * 60_000;
    this.pollInitialDelayMs = opts.poll?.initialDelayMs ?? 10_000;
    this.pollMaxDelayMs = opts.poll?.maxDelayMs ?? 60_000;
    this.pollJitterRatio = opts.poll?.jitterRatio ?? 0.15;

    this.auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      keyFile: opts.keyFilename,
    });
    this.storage = new Storage({ projectId: this.projectId, keyFilename: opts.keyFilename });
  }

  private async authorizedFetchJson(
    url: string,
    init: RequestInit & { timeoutMs?: number },
  ): Promise<unknown> {
    const client = await this.auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const timeoutMs = init.timeoutMs ?? 30_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });

      const text = await res.text();

      if (!res.ok) {
        throw new VertexVeoClientError(`HTTP ${res.status} ${res.statusText}: ${text}`);
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          return JSON.parse(text) as unknown;
        } catch (e) {
          throw new VertexVeoClientError(
            `Vertex returned non-JSON despite content-type application/json. Body: ${text.slice(0, 2_000)}`,
            e,
          );
        }
      }

      // Some endpoints may not set content-type consistently; attempt JSON parse.
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return { raw: text } satisfies Record<string, unknown>;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private async withRetry<T>(
    label: string,
    fn: () => Promise<T>,
    opts?: Readonly<{ maxAttempts?: number; baseDelayMs?: number }>,
  ): Promise<T> {
    const maxAttempts = opts?.maxAttempts ?? 5;
    const baseDelayMs = opts?.baseDelayMs ?? 800;

    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;

        // Retry only if it's plausibly transient.
        // We keep it conservative: client errors are usually non-retryable, but 429 is.
        const msg = err instanceof Error ? err.message : String(err);
        const retryable =
          msg.includes("HTTP 429") ||
          msg.includes("HTTP 500") ||
          msg.includes("HTTP 502") ||
          msg.includes("HTTP 503") ||
          msg.includes("HTTP 504") ||
          msg.includes("abort") ||
          msg.includes("ECONNRESET") ||
          msg.includes("ETIMEDOUT");

        if (!retryable || attempt === maxAttempts) break;

        const delay = withJitter(baseDelayMs * Math.pow(2, attempt - 1), 0.25);
        // eslint-disable-next-line no-console
        console.warn(`[veo][retry] ${label} attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms. ${msg}`);
        await sleep(delay);
      }
    }

    throw new VertexVeoClientError(`[veo] ${label} failed after retries`, lastErr);
  }

  private buildPredictLongRunningBody(req: VeoGenerateRequest): unknown {
    // Keep the request as close to docs as possible.
    const instances: Record<string, unknown>[] = [];
    const instance: Record<string, unknown> = { prompt: req.prompt };

    if (req.image) {
      instance.image = req.image;
    }

    if (req.referenceImages && req.referenceImages.length > 0) {
      instance.referenceImages = req.referenceImages.map((ri) => ({
        referenceType: ri.referenceType ?? "asset",
        image: ri.image,
      }));
    }

    instances.push(instance);

    const parameters: Record<string, unknown> = {};

    if (req.outputGcsUri) parameters.storageUri = ensureTrailingSlash(req.outputGcsUri);
    if (req.sampleCount !== undefined) parameters.sampleCount = req.sampleCount;
    if (req.aspectRatio) parameters.aspectRatio = req.aspectRatio;
    if (req.negativePrompt) parameters.negativePrompt = req.negativePrompt;
    if (req.personGeneration) parameters.personGeneration = req.personGeneration;
    if (req.resolution) parameters.resolution = req.resolution;
    if (req.seed !== undefined) parameters.seed = req.seed;
    if (req.generateAudio !== undefined) parameters.generateAudio = req.generateAudio;

    // durationSeconds is not strictly required for your “8s ad” use case.
    // If you ever want to expose it, add it here intentionally.

    return { instances, parameters };
  }

  /**
   * Phase 3 — Submit async Veo generation job.
   * Returns a fully qualified operation name.
   */
  public async submitGeneration(req: VeoGenerateRequest): Promise<string> {
    const url = `https://${this.host}${this.modelBasePath}:predictLongRunning`;
    const body = this.buildPredictLongRunningBody(req);

    const data = await this.withRetry("submitGeneration", async () => {
      return this.authorizedFetchJson(url, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 90_000,
      });
    });

    if (!isRecord(data)) throw new VertexVeoClientError("Unexpected submit response shape (not an object)");
    const opName = readString(data, "name");
    if (!opName) throw new VertexVeoClientError("Vertex submit response missing operation name");
    return opName;
  }

  /**
   * Fetch a single poll response for an operation.
   * This uses the model-scoped fetchPredictOperation endpoint.
   */
  private async fetchOperationOnce(operationName: string): Promise<unknown> {
    const url = `https://${this.host}${this.modelBasePath}:fetchPredictOperation`;
    const body = { operationName };

    return this.withRetry("fetchPredictOperation", async () => {
      return this.authorizedFetchJson(url, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 60_000,
      });
    });
  }

  /**
   * Phase 3 — Poll until completion (or timeout).
   */
  public async waitForCompletion(operationName: string): Promise<VeoCompletedResult> {
    const startedAt = Date.now();

    let delayMs = this.pollInitialDelayMs;
    await sleep(withJitter(delayMs, this.pollJitterRatio));

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - startedAt > this.pollTimeoutMs) {
        throw new VertexVeoClientError(
          `Timed out waiting for Veo operation after ${this.pollTimeoutMs}ms: ${operationName}`,
        );
      }

      const raw = await this.fetchOperationOnce(operationName);

      if (!isRecord(raw)) {
        throw new VertexVeoClientError("Unexpected operation response shape (not an object)");
      }

      const done = readBoolean(raw, "done") ?? false;
      const error = raw["error"];

      if (error && isRecord(error)) {
        const message = readString(error, "message") ?? "Unknown Vertex operation error";
        throw new VertexVeoOperationError(message, operationName, error);
      }

      if (!done) {
        delayMs = Math.min(this.pollMaxDelayMs, Math.round(delayMs * 1.35));
        await sleep(withJitter(delayMs, this.pollJitterRatio));
        continue;
      }

      const response = raw["response"];
      if (!isRecord(response)) {
        throw new VertexVeoClientError("Operation completed but missing response object");
      }

      const videosRaw = response["videos"];
      const raiFiltered = readNumber(response, "raiMediaFilteredCount");

      const videos: VeoVideo[] = [];
      if (Array.isArray(videosRaw)) {
        for (const v of videosRaw) {
          if (!isRecord(v)) continue;
          const gcsUri = readString(v, "gcsUri");
          const bytesBase64Encoded = readString(v, "bytesBase64Encoded");
          const mimeType = readString(v, "mimeType");
          videos.push({ gcsUri, bytesBase64Encoded, mimeType });
        }
      }

      return { operationName, videos, raiMediaFilteredCount: raiFiltered };
    }
  }

  /**
   * Phase 3 (convenience) — Submit + poll.
   * Includes optional fallback behavior if referenceImages is rejected by the model.
   */
  public async generate(req: VeoGenerateRequest): Promise<VeoCompletedResult> {
    try {
      const operationName = await this.submitGeneration(req);
      return await this.waitForCompletion(operationName);
    } catch (err) {
      // If referenceImages is rejected (preview gating / model differences), optionally retry as image-to-video.
      const msg = err instanceof Error ? err.message : String(err);
      const wantsFallback = req.fallbackToImageToVideoOnReferenceRejection ?? true;

      const looksLikeReferenceRejection =
        msg.toLowerCase().includes("referenceimages") ||
        msg.toLowerCase().includes("reference images") ||
        msg.toLowerCase().includes("invalid argument") ||
        msg.toLowerCase().includes("unrecognized field") ||
        msg.toLowerCase().includes("not supported");

      const canFallback =
        wantsFallback &&
        looksLikeReferenceRejection &&
        (!req.image && (req.referenceImages?.length ?? 0) > 0);

      if (!canFallback) throw err;

      const first = req.referenceImages?.[0];
      if (!first) throw err;

      // Retry by turning the first reference image into image-to-video.
      const retryReq: VeoGenerateRequest = {
        ...req,
        referenceImages: undefined,
        image: first.image,
      };

      // eslint-disable-next-line no-console
      console.warn("[veo] referenceImages rejected; retrying as image-to-video using first reference image.");
      const op = await this.submitGeneration(retryReq);
      return await this.waitForCompletion(op);
    }
  }

  /**
   * Download videos to disk.
   * - If gcsUri exists -> download via @google-cloud/storage
   * - else if bytesBase64Encoded exists -> write buffer
   */
  public async download(
    result: VeoCompletedResult,
    outDir: string,
    opts?: Readonly<{ filenamePrefix?: string }>,
  ): Promise<VeoDownloadResult> {
    await mkdir(outDir, { recursive: true });

    const localPaths: string[] = [];
    const gcsUris: string[] = [];
    const prefix = opts?.filenamePrefix ?? `veo_${randomUUID()}`;

    for (let i = 0; i < result.videos.length; i++) {
      const v = result.videos[i];
      const ext = v.mimeType?.includes("webm") ? "webm" : "mp4"; // most outputs are mp4
      const filename = `${prefix}_${String(i + 1).padStart(2, "0")}.${ext}`;
      const localPath = `${outDir}/${filename}`;

      if (v.gcsUri) {
        gcsUris.push(v.gcsUri);
        const { bucket, object } = parseGsUri(v.gcsUri);
        await mkdir(dirname(localPath), { recursive: true });
        await this.storage.bucket(bucket).file(object).download({ destination: localPath });
        localPaths.push(localPath);
        continue;
      }

      if (v.bytesBase64Encoded) {
        const buf = Buffer.from(v.bytesBase64Encoded, "base64");
        await writeFile(localPath, buf);
        localPaths.push(localPath);
        continue;
      }

      throw new VertexVeoClientError("Video output contained neither gcsUri nor bytesBase64Encoded.");
    }

    return { ...result, localPaths, gcsUris };
  }

  /**
   * One-call helper: generate + download.
   */
  public async generateAndDownload(
    req: VeoGenerateRequest,
    outDir: string,
    opts?: Readonly<{ filenamePrefix?: string }>,
  ): Promise<VeoDownloadResult> {
    const res = await this.generate(req);
    if (res.videos.length === 0) {
      throw new VertexVeoClientError(
        `Veo returned 0 videos (may be filtered). operation=${res.operationName}`,
      );
    }
    return this.download(res, outDir, opts);
  }
}