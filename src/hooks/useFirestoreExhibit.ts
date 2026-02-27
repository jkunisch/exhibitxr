"use client";

import { useEffect, useRef, useCallback } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEditorStore } from "@/store/editorStore";
import { ExhibitConfigSchema, type ExhibitConfig } from "@/types/schema";
import { sanitizeAmbientIntensity } from "@/lib/lighting";

const DEBOUNCE_MS = 2000;
export type EditorConfigUpdate = Partial<ExhibitConfig> & {
    ambientIntensity?: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deep-merge two exhibit config partials, preserving nested `model` fields. */
function mergeExhibitConfig(
    base: ExhibitConfig,
    patch: Partial<ExhibitConfig>,
): ExhibitConfig {
    return {
        ...base,
        ...patch,
        model: patch.model ? { ...base.model, ...patch.model } : base.model,
    };
}

/** Aggregate multiple config patches within a debounce window. */
function mergePatches(
    prev: Partial<ExhibitConfig> | null,
    next: Partial<ExhibitConfig>,
): Partial<ExhibitConfig> {
    if (!prev) return next;
    return {
        ...prev,
        ...next,
        model: next.model
            ? { ...(prev.model ?? {}), ...next.model }
            : prev.model,
    };
}

/**
 * Convert a config partial into Firestore dot-path update fields.
 * This prevents `updateDoc({ model: { glbUrl } })` from wiping other
 * model fields — instead it writes `"model.glbUrl": value`.
 */
function toFirestoreUpdate(
    patch: Partial<ExhibitConfig>,
): Record<string, unknown> {
    const write: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        if (key === "id" || key === "tenantId") continue;

        if (key === "model" && value && typeof value === "object") {
            const modelPatch = value as Record<string, unknown>;
            for (const [mKey, mValue] of Object.entries(modelPatch)) {
                if (mValue === undefined) continue;
                write[`model.${mKey}`] = mValue;
            }
            continue;
        }
        write[key] = value;
    }
    return write;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Firestore ↔ Zustand sync hook for the exhibit editor.
 *
 * - Subscribes to `/tenants/{tenantId}/exhibitions/{exhibitId}` via onSnapshot
 * - Pushes valid snapshots into `editorStore.setConfig`
 * - Returns `saveToFirestore(partial)` which debounces writes to Firestore
 *
 * Key design decisions:
 * - **Patch aggregation**: all changes within the debounce window are merged
 *   and written together, preventing "last write wins" data loss.
 * - **Snapshot merge**: incoming snapshots are merged with pending local
 *   patches instead of being ignored during saves, preventing state drift.
 * - **Dot-path writes**: nested `model` fields use Firestore dot notation
 *   to avoid clobbering the entire `model` object.
 */
export function useFirestoreExhibit(
    tenantId: string,
    exhibitId: string,
    authReady: boolean = true,
) {
    const setConfig = useEditorStore((s) => s.setConfig);
    const setAmbientIntensity = useEditorStore((s) => s.setAmbientIntensity);
    const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
    const reset = useEditorStore((s) => s.reset);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);

    // Aggregated pending patches while debounce is active.
    const pendingPatchRef = useRef<Partial<ExhibitConfig> | null>(null);
    const pendingAmbientRef = useRef<number | undefined>(undefined);

    // ─── Firestore Listener ──────────────────────────────────────────────────

    useEffect(() => {
        if (!authReady) return;

        // Immediately clear stale config from a previous exhibit
        reset();

        isMounted.current = true;

        const docRef = doc(db, "tenants", tenantId, "exhibitions", exhibitId);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (!isMounted.current) return;

                if (!snapshot.exists()) {
                    setSaveStatus("error", "Exhibition document not found.");
                    return;
                }

                const raw = snapshot.data();
                const ambientIntensity = sanitizeAmbientIntensity(
                    raw.ambientIntensity,
                );

                // Build a normalized input — Firestore may store model fields
                // flat (glbUrl, title at root) instead of nested under `model`.
                const input: Record<string, unknown> = {
                    ...raw,
                    id: snapshot.id,
                    tenantId,
                };

                // If no `model` object exists, attempt to construct one from flat fields
                if (!raw.model && typeof raw.glbUrl === "string") {
                    input.model = {
                        id: snapshot.id,
                        label: raw.title ?? "Model",
                        glbUrl: raw.glbUrl,
                        scale: raw.scale ?? 1,
                        position: raw.position ?? [0, 0, 0],
                        variants: raw.variants ?? [],
                        hotspots: raw.hotspots ?? [],
                    };
                }

                const result = ExhibitConfigSchema.safeParse(input);

                if (result.success) {
                    // Merge incoming snapshot with any pending local patches
                    // so we don't overwrite optimistic UI state (snap-back).
                    const patch = pendingPatchRef.current;
                    const next = patch
                        ? mergeExhibitConfig(result.data, patch)
                        : result.data;
                    const effectiveAmbient =
                        pendingAmbientRef.current !== undefined
                            ? pendingAmbientRef.current
                            : ambientIntensity;
                    setConfig(next, effectiveAmbient);

                    const currentStatus =
                        useEditorStore.getState().saveStatus;
                    if (currentStatus !== "saving") {
                        setSaveStatus("idle");
                    }
                } else {
                    console.warn(
                        "[useFirestoreExhibit] Schema validation failed:",
                        result.error.issues.map(
                            (i) => `${i.path.join(".")}: ${i.message}`,
                        ),
                    );

                    // Best-effort config from raw data
                    const existingConfig =
                        useEditorStore.getState().config;
                    const rawModel = raw.model ?? {};
                    const model = {
                        id: rawModel.id ?? snapshot.id,
                        label:
                            rawModel.label ??
                            raw.title ??
                            existingConfig?.model?.label ??
                            "Model",
                        glbUrl:
                            rawModel.glbUrl ??
                            raw.glbUrl ??
                            existingConfig?.model?.glbUrl ??
                            "",
                        scale:
                            rawModel.scale ??
                            raw.scale ??
                            existingConfig?.model?.scale ??
                            1,
                        position:
                            rawModel.position ??
                            raw.position ??
                            existingConfig?.model?.position ??
                            [0, 0, 0],
                        variants:
                            rawModel.variants ??
                            raw.variants ??
                            existingConfig?.model?.variants ??
                            [],
                        hotspots:
                            rawModel.hotspots ??
                            raw.hotspots ??
                            existingConfig?.model?.hotspots ??
                            [],
                    };
                    const fallback = {
                        id: snapshot.id,
                        tenantId,
                        title: raw.title ?? "",
                        model,
                        environment: raw.environment ?? "studio",
                        envRotation: raw.envRotation ?? 0,
                        ambientIntensity: raw.ambientIntensity ?? 0.8,
                        stageType: raw.stageType ?? "none",
                        autoRotate: raw.autoRotate ?? false,
                        entryAnimation: raw.entryAnimation ?? "none",
                        contactShadows: raw.contactShadows ?? true,
                        cameraPosition: raw.cameraPosition ?? [0, 1.5, 4],
                        bgColor: raw.bgColor ?? "#111111",
                    } as ExhibitConfig;

                    // Merge pending patches over fallback too
                    const patch = pendingPatchRef.current;
                    const next = patch
                        ? mergeExhibitConfig(fallback, patch)
                        : fallback;
                    const effectiveAmbient =
                        pendingAmbientRef.current !== undefined
                            ? pendingAmbientRef.current
                            : ambientIntensity;
                    setConfig(next, effectiveAmbient);

                    const currentStatus =
                        useEditorStore.getState().saveStatus;
                    if (currentStatus !== "saving") {
                        setSaveStatus("idle");
                    }
                }
            },
            (error) => {
                if (!isMounted.current) return;
                console.error(
                    "[useFirestoreExhibit] onSnapshot error:",
                    error,
                );
                setSaveStatus("error", error.message);
            },
        );

        return () => {
            isMounted.current = false;
            unsubscribe();
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            reset();
        };
    }, [
        authReady,
        tenantId,
        exhibitId,
        setConfig,
        setSaveStatus,
        reset,
        setAmbientIntensity,
    ]);

    // ─── Debounced Write ─────────────────────────────────────────────────────

    const saveToFirestore = useCallback(
        (partial: EditorConfigUpdate) => {
            const { ambientIntensity, ...configPartial } = partial;

            // Aggregate patches across the debounce window (Bug A fix)
            pendingPatchRef.current = mergePatches(
                pendingPatchRef.current,
                configPartial,
            );
            if (ambientIntensity !== undefined) {
                pendingAmbientRef.current =
                    sanitizeAmbientIntensity(ambientIntensity);
            }

            // Optimistically update the local store immediately
            useEditorStore.getState().updateConfig(configPartial);
            if (ambientIntensity !== undefined) {
                setAmbientIntensity(ambientIntensity);
            }
            setSaveStatus("saving");

            // Cancel any pending debounce
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(async () => {
                try {
                    const docRef = doc(
                        db,
                        "tenants",
                        tenantId,
                        "exhibitions",
                        exhibitId,
                    );

                    const patchToWrite = pendingPatchRef.current;
                    const ambientToWrite = pendingAmbientRef.current;
                    if (!patchToWrite && ambientToWrite === undefined) return;

                    // Use dot-path notation to avoid clobbering nested objects (Bug C fix)
                    const writeData: Record<string, unknown> = {
                        ...(patchToWrite
                            ? toFirestoreUpdate(patchToWrite)
                            : {}),
                    };
                    if (ambientToWrite !== undefined) {
                        writeData.ambientIntensity = ambientToWrite;
                    }

                    await updateDoc(docRef, writeData);

                    // Acked — clear pending patches
                    pendingPatchRef.current = null;
                    pendingAmbientRef.current = undefined;

                    if (isMounted.current) {
                        setSaveStatus("saved");
                        // Clear "saved" status after 2s
                        setTimeout(() => {
                            if (isMounted.current) {
                                const current =
                                    useEditorStore.getState().saveStatus;
                                if (current === "saved") {
                                    setSaveStatus("idle");
                                }
                            }
                        }, 2000);
                    }
                } catch (error) {
                    if (isMounted.current) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : "Write failed.";
                        console.error(
                            "[useFirestoreExhibit] Write error:",
                            message,
                        );
                        setSaveStatus("error", message);
                    }
                }
            }, DEBOUNCE_MS);
        },
        [tenantId, exhibitId, setAmbientIntensity, setSaveStatus],
    );

    return { saveToFirestore };
}
