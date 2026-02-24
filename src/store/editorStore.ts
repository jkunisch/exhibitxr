import { create } from "zustand";
import type { ExhibitConfig } from "@/types/schema";
import {
    DEFAULT_AMBIENT_INTENSITY,
    sanitizeAmbientIntensity,
} from "@/lib/lighting";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorState {
    /** The current exhibit config from Firestore. */
    config: ExhibitConfig | null;
    /** Currently selected variant ID in the viewer. */
    activeVariantId: string | undefined;
    /** Currently focused hotspot ID. */
    activeHotspotId: string | null;
    /** ID of the model currently selected for PivotControls editing. */
    selectedModelId: string | null;
    /** Ambient light intensity for editor + embed lighting control. */
    ambientIntensity: number;
    /** Firestore save status. */
    saveStatus: SaveStatus;
    /** Error message when saveStatus is "error". */
    saveError: string | null;

    // ─── Actions ────────────────────────────────────────────────────────────────

    /** Replace the full config (called by onSnapshot listener). */
    setConfig: (config: ExhibitConfig, ambientIntensity?: number) => void;
    /** Merge a partial config update (called by form fields). */
    updateConfig: (partial: Partial<ExhibitConfig>) => void;
    /** Set active variant for the viewer. */
    setActiveVariant: (variantId: string | undefined) => void;
    /** Set focused hotspot for camera fly-to. */
    setActiveHotspot: (hotspotId: string | null) => void;
    /** Select a model for PivotControls editing. */
    setSelectedModel: (modelId: string | null) => void;
    /** Set ambient light intensity for the viewer. */
    setAmbientIntensity: (value: number) => void;
    /** Update the save status indicator. */
    setSaveStatus: (status: SaveStatus, error?: string) => void;
    /** Reset editor state (called on unmount). */
    reset: () => void;
}

const initialState = {
    config: null,
    activeVariantId: undefined,
    activeHotspotId: null,
    selectedModelId: null,
    ambientIntensity: DEFAULT_AMBIENT_INTENSITY,
    saveStatus: "idle" as SaveStatus,
    saveError: null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
    ...initialState,

    setConfig: (config, ambientIntensity) => {
        const current = get().config;
        // Only update if content actually changed (avoids re-render loops from own writes)
        const nextAmbient =
            ambientIntensity === undefined
                ? get().ambientIntensity
                : sanitizeAmbientIntensity(ambientIntensity);

        if (
            current &&
            current.id === config.id &&
            JSON.stringify(current) === JSON.stringify(config) &&
            nextAmbient === get().ambientIntensity
        ) {
            return;
        }
        set({
            config,
            activeVariantId: get().activeVariantId ?? config.model.variants[0]?.id,
            ambientIntensity: nextAmbient,
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

    setSelectedModel: (modelId) => {
        set({ selectedModelId: modelId });
    },

    setAmbientIntensity: (value) => {
        set({ ambientIntensity: sanitizeAmbientIntensity(value) });
    },

    setSaveStatus: (status, error) => {
        set({ saveStatus: status, saveError: error ?? null });
    },

    reset: () => {
        set(initialState);
    },
}));
