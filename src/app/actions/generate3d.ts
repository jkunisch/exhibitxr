"use server";

import { getStorage, type Storage } from "firebase-admin/storage";

import * as firebaseAdmin from "@/lib/firebaseAdmin";
import { type GenerateResult, pollTaskStatus, type PollResult, submitImageTo3D } from "@/lib/meshy";
import { optimizeGlb } from "@/lib/glbOptimizer";

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

    if (!(rawImage instanceof File)) {
      throw new Error("Missing image file in form data.");
    }

    if (!ALLOWED_IMAGE_TYPES.has(rawImage.type)) {
      throw new Error("Unsupported image type. Only PNG, JPEG, and WEBP are allowed.");
    }

    if (rawImage.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Image is too large. Maximum size is 10MB.");
    }

    const imageBuffer = Buffer.from(await rawImage.arrayBuffer());
    const filename = rawImage.name.trim().length > 0 ? rawImage.name : "upload-image";

    return await submitImageTo3D(imageBuffer, filename);
  } catch (error: unknown) {
    throw new Error(`Failed to submit image for 3D generation: ${toErrorMessage(error)}`);
  }
}

export async function checkStatus(taskId: string): Promise<PollResult> {
  try {
    const normalizedTaskId = ensureNonEmptyValue(taskId, "taskId");
    return await pollTaskStatus(normalizedTaskId);
  } catch (error: unknown) {
    throw new Error(`Failed to check Meshy task status: ${toErrorMessage(error)}`);
  }
}

export async function finalizeModel(
  taskId: string,
  tenantId: string,
  exhibitId: string,
): Promise<{ glbUrl: string }> {
  try {
    const normalizedTaskId = ensureNonEmptyValue(taskId, "taskId");
    const normalizedTenantId = ensureNonEmptyValue(tenantId, "tenantId");
    const normalizedExhibitId = ensureNonEmptyValue(exhibitId, "exhibitId");

    const pollResult = await pollTaskStatus(normalizedTaskId);
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
