import crypto from "node:crypto";

import { getStorage } from "firebase-admin/storage";

import { getAdminApp } from "@/lib/firebaseAdmin";
import { optimizeGlb } from "@/lib/glbOptimizer";

const snapPreviewUrlCache = new Map<string, string>();

export async function finalizePublicSnap(taskId: string, meshyGlbUrl: string): Promise<string> {
  const normalizedTaskId = taskId.trim();
  const normalizedMeshyGlbUrl = meshyGlbUrl.trim();

  if (normalizedTaskId.length === 0) {
    throw new Error("Missing taskId.");
  }

  if (normalizedMeshyGlbUrl.length === 0) {
    throw new Error("Missing meshyGlbUrl.");
  }

  const cachedUrl = snapPreviewUrlCache.get(normalizedTaskId);
  if (cachedUrl) {
    return cachedUrl;
  }

  const glbResponse = await fetch(normalizedMeshyGlbUrl, { method: "GET" });
  if (!glbResponse.ok) {
    throw new Error(`Failed to download generated GLB (${glbResponse.status}).`);
  }

  const rawBuffer = Buffer.from(await glbResponse.arrayBuffer());
  if (rawBuffer.length === 0) {
    throw new Error("Downloaded GLB file is empty.");
  }

  const optimizedBuffer = await optimizeGlb(rawBuffer);

  const storagePath = `public/snap-previews/${normalizedTaskId}.glb`;
  const storage = getStorage(getAdminApp());
  const bucket = storage.bucket();
  const storageFile = bucket.file(storagePath);
  const downloadToken = crypto.randomUUID();

  await storageFile.save(optimizedBuffer, {
    resumable: false,
    metadata: {
      contentType: "model/gltf-binary",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const encodedStoragePath = encodeURIComponent(storagePath);
  const downloadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodedStoragePath}?alt=media&token=${downloadToken}`;

  snapPreviewUrlCache.set(normalizedTaskId, downloadUrl);
  return downloadUrl;
}
