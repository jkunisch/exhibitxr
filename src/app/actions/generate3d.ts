"use server";

import { getStorage, type Storage } from "firebase-admin/storage";

import * as firebaseAdmin from "@/lib/firebaseAdmin";
import { type GenerateResult, pollTaskStatus as pollMeshy, type PollResult, submitImageTo3D as submitMeshy } from "@/lib/meshy";
import { submitImageToTripo, pollTripoTaskStatus } from "@/lib/tripo";
import { optimizeGlb } from "@/lib/glbOptimizer";
import { getSessionUser } from "@/lib/session";
import { deductCredits, getGenerationCost, getCreditBalance, isAdminEmail, refundCredits } from "@/lib/credits";
import { notifyModelGeneration } from "@/lib/telegram";

export type Provider = "basic" | "premium";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown error.";
}

function ensureNonEmptyValue(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`Missing ${fieldName}.`);
  }

  return trimmed;
}

function getAdminStorage(): Storage {
  const moduleLike = firebaseAdmin as Record<string, unknown>;
  const maybeGetAdminStorage = moduleLike["getAdminStorage"];

  if (typeof maybeGetAdminStorage === "function") {
    return (maybeGetAdminStorage as () => Storage)();
  }

  return getStorage(firebaseAdmin.getAdminApp());
}

export async function submitImage(formData: FormData): Promise<GenerateResult> {
  try {
    const rawImage = formData.get("image");
    const provider = (formData.get("provider") as Provider) ?? "premium";

    if (!(rawImage instanceof File)) {
      throw new Error("Missing image file in form data.");
    }

    if (!ALLOWED_IMAGE_TYPES.has(rawImage.type)) {
      throw new Error("Unsupported image type. Only PNG, JPEG, and WEBP are allowed.");
    }

    if (rawImage.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Image is too large. Maximum size is 10MB.");
    }

    // ── Credit check ────────────────────────────────────────────────────
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      throw new Error("Nicht angemeldet. Bitte zuerst einloggen.");
    }

    const adminBypass = isAdminEmail(sessionUser.email);

    if (!adminBypass) {
      const cost = getGenerationCost(provider);
      const balance = await getCreditBalance(sessionUser.tenantId);
      if (balance.credits < cost) {
        throw new Error(
          `Nicht genügend Credits (${balance.credits}/${cost}). ` +
          `Bitte upgraden oder Credits zukaufen.`
        );
      }
    }

    // ── Submit to provider ──────────────────────────────────────────────
    const imageBuffer = Buffer.from(await rawImage.arrayBuffer());
    const filename = rawImage.name.trim().length > 0 ? rawImage.name : "upload-image";

    // Deduct credits before API call (will refund on failure)
    if (!adminBypass) {
      await deductCredits(sessionUser.tenantId, provider);
    }

    let result: GenerateResult;
    try {
      if (provider === "basic") {
        result = await submitImageToTripo(imageBuffer, filename);
      } else {
        result = await submitMeshy(imageBuffer, filename);
      }
    } catch (apiError) {
      // API call failed — refund the credit
      if (!adminBypass) {
        await refundCredits(
          sessionUser.tenantId,
          provider,
          `API submission failed: ${toErrorMessage(apiError)}`
        );
      }
      throw apiError;
    }

    // ── Telegram notification (non-admin only, fire-and-forget) ──────
    if (!adminBypass) {
      notifyModelGeneration({ email: sessionUser.email, provider }).catch(() => { });
    }

    return result;
  } catch (error: unknown) {
    throw new Error(`Failed to submit image for 3D generation: ${toErrorMessage(error)}`);
  }
}

export async function checkStatus(taskId: string, provider: Provider = "premium"): Promise<PollResult> {
  try {
    const normalizedTaskId = ensureNonEmptyValue(taskId, "taskId");
    if (provider === "basic") {
      return await pollTripoTaskStatus(normalizedTaskId);
    }
    return await pollMeshy(normalizedTaskId);
  } catch (error: unknown) {
    throw new Error(`Failed to check task status: ${toErrorMessage(error)}`);
  }
}

export async function finalizeModel(
  taskId: string,
  tenantId: string,
  exhibitId: string,
  provider: Provider = "premium",
): Promise<{ glbUrl: string }> {
  try {
    const normalizedTaskId = ensureNonEmptyValue(taskId, "taskId");
    const normalizedTenantId = ensureNonEmptyValue(tenantId, "tenantId");
    const normalizedExhibitId = ensureNonEmptyValue(exhibitId, "exhibitId");

    const pollFn = provider === "basic" ? pollTripoTaskStatus : pollMeshy;
    const pollResult = await pollFn(normalizedTaskId);
    if (pollResult.status !== "SUCCEEDED") {
      throw new Error(`Meshy task is not finished. Current status: ${pollResult.status}.`);
    }

    if (!pollResult.glbUrl) {
      throw new Error("Meshy task succeeded but no GLB URL was returned.");
    }

    const glbResponse = await fetch(pollResult.glbUrl, { method: "GET" });
    if (!glbResponse.ok) {
      throw new Error(`Failed to download generated GLB (${glbResponse.status}).`);
    }

    const rawBuffer = Buffer.from(await glbResponse.arrayBuffer());
    if (rawBuffer.length === 0) {
      throw new Error("Downloaded GLB file is empty.");
    }

    // Optimize: dedup, simplify, draco compress (40MB → 2-3MB typically)
    const glbBuffer = await optimizeGlb(rawBuffer);

    const timestamp = Date.now();
    const storagePath = `tenants/${normalizedTenantId}/models/ai-generated-${timestamp}.glb`;
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const storageFile = bucket.file(storagePath);
    const downloadToken = crypto.randomUUID();

    await storageFile.save(glbBuffer, {
      resumable: false,
      metadata: {
        contentType: "model/gltf-binary",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          tenantId: normalizedTenantId,
          isPublished: "false",
          meshyTaskId: normalizedTaskId,
        },
      },
    });

    const encodedStoragePath = encodeURIComponent(storagePath);
    const downloadURL =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodedStoragePath}?alt=media&token=${downloadToken}`;

    const adminDb = firebaseAdmin.getAdminDb();
    await adminDb
      .collection("tenants")
      .doc(normalizedTenantId)
      .collection("exhibitions")
      .doc(normalizedExhibitId)
      .update({
        "model.glbUrl": downloadURL,
      });

    return { glbUrl: downloadURL };
  } catch (error: unknown) {
    throw new Error(`Failed to finalize generated model: ${toErrorMessage(error)}`);
  }
}
