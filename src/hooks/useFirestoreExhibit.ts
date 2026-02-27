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

type FirestoreExhibitWrite = Partial<Omit<ExhibitConfig, "id" | "tenantId">> & {
    ambientIntensity?: number;
};

/**
 * Firestore ↔ Zustand sync hook for the exhibit editor.
 *
 * - Subscribes to `/tenants/{tenantId}/exhibitions/{exhibitId}` via onSnapshot
 * - Pushes valid snapshots into `editorStore.setConfig`
 * - Returns `saveToFirestore(partial)` which debounces writes to Firestore
 */
export function useFirestoreExhibit(tenantId: string, exhibitId: string, authReady: boolean = true) {
    const setConfig = useEditorStore((s) => s.setConfig);
    const setAmbientIntensity = useEditorStore((s) => s.setAmbientIntensity);
    const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
    const reset = useEditorStore((s) => s.reset);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);

    // ─── Firestore Listener ──────────────────────────────────────────────────
    // Wait for authReady signal from EditorShell (custom token sign-in)
    // before attaching the Firestore listener.

    useEffect(() => {
        if (!authReady) return;

        isMounted.current = true;

        const docRef = doc(db, "tenants", tenantId, "exhibitions", exhibitId);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (!isMounted.current) return;

                // While a debounced write is in flight, the onSnapshot will
                // fire with STALE data (the pre-write version). Applying it
                // would overwrite the optimistic local state and cause the
                // model to visibly snap back to its old position.
                const currentSaveStatus = useEditorStore.getState().saveStatus;
                if (currentSaveStatus === "saving") {
                    return;
                }

                if (!snapshot.exists()) {
                    setSaveStatus("error", "Exhibition document not found.");
                    return;
                }

                const raw = snapshot.data();
                const ambientIntensity = sanitizeAmbientIntensity(raw.ambientIntensity);

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
                    setConfig(result.data, ambientIntensity);
                    // Don't overwrite "saving" status from pending writes
                    const currentStatus = useEditorStore.getState().saveStatus;
                    if (currentStatus !== "saving") {
                        setSaveStatus("idle");
                    }
                } else {
                    console.warn(
                        "[useFirestoreExhibit] Schema validation failed:",
                        result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
                    );

                    // Build a best-effort config from raw data so the editor
                    // doesn't reset to loading screen on every Firestore round-trip.
                    const existingConfig = useEditorStore.getState().config;
                    const model = raw.model ?? {
                        id: snapshot.id,
                        label: raw.title ?? "Model",
                        glbUrl: raw.glbUrl ?? existingConfig?.model?.glbUrl ?? "",
                        scale: raw.scale ?? 1,
                        position: raw.position ?? [0, 0, 0],
                        variants: raw.variants ?? [],
                        hotspots: raw.hotspots ?? [],
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

                    setConfig(fallback, ambientIntensity);

                    const currentStatus = useEditorStore.getState().saveStatus;
                    if (currentStatus !== "saving") {
                        setSaveStatus("idle");
                    }
                }
            },
            (error) => {
                if (!isMounted.current) return;
                console.error("[useFirestoreExhibit] onSnapshot error:", error);
                setSaveStatus("error", error.message);
            }
        );

        return () => {
            isMounted.current = false;
            unsubscribe();
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            reset();
        };
    }, [authReady, tenantId, exhibitId, setConfig, setSaveStatus, reset, setAmbientIntensity]);

    // ─── Debounced Write ─────────────────────────────────────────────────────

    const saveToFirestore = useCallback(
        (partial: EditorConfigUpdate) => {
            const { ambientIntensity, ...configPartial } = partial;

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
                    const docRef = doc(db, "tenants", tenantId, "exhibitions", exhibitId);
                    // Strip id and tenantId — those are derived from the path, not stored as fields
                    const { id: _id, tenantId: _tid, ...writeConfig } = configPartial;
                    void _id;
                    void _tid;

                    const writeData: FirestoreExhibitWrite = {
                        ...writeConfig,
                    };

                    if (ambientIntensity !== undefined) {
                        writeData.ambientIntensity = sanitizeAmbientIntensity(ambientIntensity);
                    }

                    await updateDoc(docRef, writeData);

                    if (isMounted.current) {
                        setSaveStatus("saved");
                        // Clear "saved" status after 2s
                        setTimeout(() => {
                            if (isMounted.current) {
                                const current = useEditorStore.getState().saveStatus;
                                if (current === "saved") {
                                    setSaveStatus("idle");
                                }
                            }
                        }, 2000);
                    }
                } catch (error) {
                    if (isMounted.current) {
                        const message = error instanceof Error ? error.message : "Write failed.";
                        console.error("[useFirestoreExhibit] Write error:", message);
                        setSaveStatus("error", message);
                    }
                }
            }, DEBOUNCE_MS);
        },
        [tenantId, exhibitId, setAmbientIntensity, setSaveStatus]
    );

    return { saveToFirestore };
}
