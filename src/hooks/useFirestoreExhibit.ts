"use client";

import { useEffect, useRef, useCallback } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEditorStore } from "@/store/editorStore";
import { ExhibitConfigSchema, type ExhibitConfig } from "@/types/schema";

const DEBOUNCE_MS = 300;

/**
 * Firestore ↔ Zustand sync hook for the exhibit editor.
 *
 * - Subscribes to `/tenants/{tenantId}/exhibitions/{exhibitId}` via onSnapshot
 * - Pushes valid snapshots into `editorStore.setConfig`
 * - Returns `saveToFirestore(partial)` which debounces writes to Firestore
 */
export function useFirestoreExhibit(tenantId: string, exhibitId: string) {
    const setConfig = useEditorStore((s) => s.setConfig);
    const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
    const reset = useEditorStore((s) => s.reset);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);

    // ─── Firestore Listener ──────────────────────────────────────────────────

    useEffect(() => {
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
                const result = ExhibitConfigSchema.safeParse({
                    ...raw,
                    id: snapshot.id,
                    tenantId,
                });

                if (result.success) {
                    setConfig(result.data);
                    // Don't overwrite "saving" status from pending writes
                    const currentStatus = useEditorStore.getState().saveStatus;
                    if (currentStatus !== "saving") {
                        setSaveStatus("idle");
                    }
                } else {
                    console.error("[useFirestoreExhibit] Invalid snapshot data:", result.error.issues);
                    setSaveStatus("error", "Invalid exhibition data in Firestore.");
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
    }, [tenantId, exhibitId, setConfig, setSaveStatus, reset]);

    // ─── Debounced Write ─────────────────────────────────────────────────────

    const saveToFirestore = useCallback(
        (partial: Partial<ExhibitConfig>) => {
            // Optimistically update the local store immediately
            useEditorStore.getState().updateConfig(partial);
            setSaveStatus("saving");

            // Cancel any pending debounce
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(async () => {
                try {
                    const docRef = doc(db, "tenants", tenantId, "exhibitions", exhibitId);
                    // Strip id and tenantId — those are derived from the path, not stored as fields
                    const { id: _id, tenantId: _tid, ...writeData } = partial;
                    void _id;
                    void _tid;

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
        [tenantId, exhibitId, setSaveStatus]
    );

    return { saveToFirestore };
}
