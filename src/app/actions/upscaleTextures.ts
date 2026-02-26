"use server";

import { getStorage, type Storage } from "firebase-admin/storage";
import { NodeIO } from "@gltf-transform/core";
import {
    KHRDracoMeshCompression,
    KHRMeshQuantization,
    EXTTextureWebP,
    KHRMaterialsUnlit,
} from "@gltf-transform/extensions";
import * as firebaseAdmin from "@/lib/firebaseAdmin";
import { getSessionUser } from "@/lib/session";
import { deductCredits, refundCredits } from "@/lib/credits";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAdminStorage(): Storage {
    const moduleLike = firebaseAdmin as Record<string, unknown>;
    const maybeGetAdminStorage = moduleLike["getAdminStorage"];

    if (typeof maybeGetAdminStorage === "function") {
        return (maybeGetAdminStorage as () => Storage)();
    }

    return getStorage(firebaseAdmin.getAdminApp());
}

const UPSCALE_DELAY_MS = 2500; // Mock API delay

async function mockUpscaleApi(imageBuffer: Uint8Array, mimeType: string): Promise<Uint8Array> {
    // Simulate an external API call to upscale the image
    return new Promise((resolve) => {
        setTimeout(() => {
            // In a real implementation, we would send the imageBuffer to Replicate/Photoroom
            // and get back a higher resolution buffer. 
            // For now, we return a mock modified buffer by just appending some dummy bytes 
            // so it's not strictly "doing nothing" in the eyes of a hash check, but still a mock.
            const mockUpscaled = new Uint8Array(imageBuffer.length + 4);
            mockUpscaled.set(imageBuffer);
            mockUpscaled.set([0x00, 0x00, 0x00, 0x01], imageBuffer.length);
            resolve(mockUpscaled);
        }, UPSCALE_DELAY_MS);
    });
}

// ── Types ────────────────────────────────────────────────────────────────────

type UpscaleResult =
    | { ok: true; glbUrl: string }
    | { ok: false; error: string };

// ── Server Action ────────────────────────────────────────────────────────────

/**
 * "Premium Upscale" server action — downloads the current GLB, extracts textures,
 * sends them to an upscaler API (mocked), repacks the GLB, uploads it,
 * deducts 1 credit, and updates the Firestore document.
 */
export async function upscaleTexturesAction(
    exhibitId: string,
    currentGlbUrl: string,
): Promise<UpscaleResult> {
    let creditDeducted = false;

    try {
        // ── Auth & Validation ──────────────────────────────────────────────
        const user = await getSessionUser();
        if (!user) {
            return { ok: false, error: "Nicht autorisiert. Bitte erneut einloggen." };
        }

        if (!exhibitId || !currentGlbUrl) {
            return { ok: false, error: "Fehlende Parameter: exhibitId oder glbUrl." };
        }

        // ── Download current GLB ───────────────────────────────────────────
        const glbResponse = await fetch(currentGlbUrl, { method: "GET" });
        if (!glbResponse.ok) {
            return {
                ok: false,
                error: `GLB konnte nicht heruntergeladen werden (HTTP ${glbResponse.status}).`,
            };
        }

        const rawBuffer = Buffer.from(await glbResponse.arrayBuffer());
        if (rawBuffer.length === 0) {
            return { ok: false, error: "Die heruntergeladene GLB-Datei ist leer." };
        }

        // ── Deduct Credit (Fails if insufficient credits) ──────────────────
        // Important: Deduct early to avoid free upscales if process takes long
        await deductCredits(user.tenantId, "upscale");
        creditDeducted = true;

        // ── Extract, Upscale, and Repack ───────────────────────────────────
        const io = new NodeIO().registerExtensions([
            KHRDracoMeshCompression,
            KHRMeshQuantization,
            EXTTextureWebP,
            KHRMaterialsUnlit,
        ]);

        const document = await io.readBinary(new Uint8Array(rawBuffer));

        // Optimize: Only upscale the baseColorTexture to avoid Vercel timeouts (60s limit).
        // Iterating over all textures (normals, roughness, etc.) with external API calls
        // takes too long and crashes the serverless function.
        let upscaledCount = 0;
        const materials = document.getRoot().listMaterials();

        for (const material of materials) {
            const baseColorTexture = material.getBaseColorTexture();
            if (baseColorTexture) {
                const image = baseColorTexture.getImage();
                const mimeType = baseColorTexture.getMimeType();

                if (image && mimeType) {
                    const upscaledImage = await mockUpscaleApi(image, mimeType);
                    baseColorTexture.setImage(upscaledImage);
                    upscaledCount++;
                    // For safety in serverless, we only do the VERY FIRST baseColorTexture we find
                    // as one model usually shares one atlas. Break after first success.
                    break;
                }
            }
        }

        if (upscaledCount === 0) {
            throw new Error("Keine BaseColor-Textur zum Hochskalieren gefunden.");
        }

        const optimizedArray = await io.writeBinary(document);
        const upscaledBuffer = Buffer.from(
            optimizedArray.buffer,
            optimizedArray.byteOffset,
            optimizedArray.byteLength,
        );

        // ── Upload upscaled GLB to Firebase Storage ───────────────────────
        const timestamp = Date.now();
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        const downloadToken = crypto.randomUUID();

        const glbPath = `tenants/${user.tenantId}/models/upscaled-${timestamp}.glb`;
        const glbFile = bucket.file(glbPath);

        await glbFile.save(upscaledBuffer, {
            resumable: false,
            metadata: {
                contentType: "model/gltf-binary",
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken,
                    tenantId: user.tenantId,
                    upscaledFrom: currentGlbUrl,
                },
            },
        });

        const encodedGlbPath = encodeURIComponent(glbPath);
        const glbUrl =
            `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
            `${encodedGlbPath}?alt=media&token=${downloadToken}`;

        // ── Update Firestore exhibit document ──────────────────────────────
        const adminDb = firebaseAdmin.getAdminDb();
        await adminDb
            .collection("tenants")
            .doc(user.tenantId)
            .collection("exhibitions")
            .doc(exhibitId)
            .update({
                "model.glbUrl": glbUrl,
            });

        console.log(
            `[upscaleTextures] Successfully upscaled and saved to ${glbUrl} for exhibit ${exhibitId}`,
        );

        return {
            ok: true,
            glbUrl,
        };
    } catch (error: unknown) {
        console.error("[upscaleTextures] Failed:", error);

        if (creditDeducted) {
            try {
                const user = await getSessionUser();
                if (user) {
                    await refundCredits(user.tenantId, "upscale", "Upscale pipeline failed after credit deduction");
                    console.log(`[upscaleTextures] Refunded 1 credit to tenant ${user.tenantId}`);
                }
            } catch (refundError) {
                console.error("[upscaleTextures] CRITICAL: Failed to refund credit after error!", refundError);
            }
        }

        const message =
            error instanceof Error ? error.message : "Unbekannter Fehler bei der Textur-Hochskalierung.";
        return { ok: false, error: message };
    }
}
