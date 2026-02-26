"use server";

import { getStorage, type Storage } from "firebase-admin/storage";

import * as firebaseAdmin from "@/lib/firebaseAdmin";
import { optimizeGlb } from "@/lib/glbOptimizer";
import { getSessionUser } from "@/lib/session";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAdminStorage(): Storage {
    const moduleLike = firebaseAdmin as Record<string, unknown>;
    const maybeGetAdminStorage = moduleLike["getAdminStorage"];

    if (typeof maybeGetAdminStorage === "function") {
        return (maybeGetAdminStorage as () => Storage)();
    }

    return getStorage(firebaseAdmin.getAdminApp());
}

// ── Types ────────────────────────────────────────────────────────────────────

type OptimizeResult =
    | { ok: true; glbUrl: string; originalSizeKB: number; optimizedSizeKB: number; reductionPercent: number }
    | { ok: false; error: string };

// ── Server Action ────────────────────────────────────────────────────────────

/**
 * "Pro Optimize" server action — downloads the current GLB, runs the
 * gltf-transform optimization pipeline (dedup → weld → simplify → draco),
 * uploads the optimized file, and updates the Firestore document.
 */
export async function optimizeModelAction(
    exhibitId: string,
    currentGlbUrl: string,
): Promise<OptimizeResult> {
    try {
        // ── Auth & Validation ──────────────────────────────────────────────
        const user = await getSessionUser();
        if (!user) {
            return { ok: false, error: "Nicht autorisiert. Bitte erneut einloggen." };
        }

        if (!exhibitId || !currentGlbUrl) {
            return { ok: false, error: "Fehlende Parameter: exhibitId oder glbUrl." };
        }

        // ── Credit Sink Placeholder ────────────────────────────────────────
        // TODO: When the premium credit system is implemented, add a credit
        // check and deduction here. Example:
        //
        //   const cost = getOptimizationCost();
        //   const balance = await getCreditBalance(user.tenantId);
        //   if (balance < cost) {
        //     return { ok: false, error: "Nicht genügend Credits." };
        //   }
        //   await deductCredits(user.tenantId, cost, "model_optimization");

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

        const originalSizeKB = Math.round(rawBuffer.length / 1024);

        // ── Optimize via gltf-transform pipeline ───────────────────────────
        const optimizedBuffer = await optimizeGlb(rawBuffer);
        const optimizedSizeKB = Math.round(optimizedBuffer.length / 1024);
        const reductionPercent = Math.round(
            ((rawBuffer.length - optimizedBuffer.length) / rawBuffer.length) * 100,
        );

        // ── Upload optimized GLB to Firebase Storage ───────────────────────
        const timestamp = Date.now();
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        const downloadToken = crypto.randomUUID();

        const glbPath = `tenants/${user.tenantId}/models/optimized-${timestamp}.glb`;
        const glbFile = bucket.file(glbPath);

        await glbFile.save(optimizedBuffer, {
            resumable: false,
            metadata: {
                contentType: "model/gltf-binary",
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken,
                    tenantId: user.tenantId,
                    optimizedFrom: "pro-optimize",
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
            `[optimizeModel] ${originalSizeKB}KB → ${optimizedSizeKB}KB (↓${reductionPercent}%) for exhibit ${exhibitId}`,
        );

        return {
            ok: true,
            glbUrl,
            originalSizeKB,
            optimizedSizeKB,
            reductionPercent,
        };
    } catch (error: unknown) {
        console.error("[optimizeModel] Failed:", error);
        const message =
            error instanceof Error ? error.message : "Unbekannter Fehler bei der Optimierung.";
        return { ok: false, error: message };
    }
}
