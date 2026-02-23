import { create } from "zustand";
import type { ExhibitConfig } from "@/types/schema";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorState {
    /** The current exhibit config from Firestore. */
    config: ExhibitConfig | null;
    /** Currently selected variant ID in the viewer. */
    activeVariantId: string | undefined;
    /** Currently focused hotspot ID. */
    activeHotspotId: string | null;
    /** Firestore save status. */
    saveStatus: SaveStatus;
    /** Error message when saveStatus is "error". */
    saveError: string | null;

    // ─── Actions ────────────────────────────────────────────────────────────────

    /** Replace the full config (called by onSnapshot listener). */
    setConfig: (config: ExhibitConfig) => void;
    /** Merge a partial config update (called by form fields). */
    updateConfig: (partial: Partial<ExhibitConfig>) => void;
    /** Set active variant for the viewer. */
    setActiveVariant: (variantId: string | undefined) => void;
    /** Set focused hotspot for camera fly-to. */
    setActiveHotspot: (hotspotId: string | null) => void;
    /** Update the save status indicator. */
    setSaveStatus: (status: SaveStatus, error?: string) => void;
    /** Reset editor state (called on unmount). */
    reset: () => void;
}

const initialState = {
    config: null,
    activeVariantId: undefined,
    activeHotspotId: null,
    saveStatus: "idle" as SaveStatus,
    saveError: null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
    ...initialState,

    setConfig: (config) => {
        const current = get().config;
        // Only update if content actually changed (avoids re-render loops from own writes)
        if (current && current.id === config.id && JSON.stringify(current) === JSON.stringify(config)) {
            return;
        }
        set({
            config,
            activeVariantId: get().activeVariantId ?? config.model.variants[0]?.id,
        });
    },

    updateConfig: (partial) => {
        const current = get().config;
        if (!current) return;
        set({ config: { ...current, ...partial } });
    },

    setActiveVariant: (variantId) => {
        set({ activeVariantId: variantId });
    },

    setActiveHotspot: (hotspotId) => {
        set({ activeHotspotId: hotspotId });
    },

    setSaveStatus: (status, error) => {
        set({ saveStatus: status, saveError: error ?? null });
    },

    reset: () => {
        set(initialState);
    },
}));
