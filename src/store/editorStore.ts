import { create } from "zustand";
import type { ExhibitConfig } from "@/types/schema";
import {
    DEFAULT_AMBIENT_INTENSITY,
    sanitizeAmbientIntensity,
} from "@/lib/lighting";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// ── Config History (external to avoid circular state updates) ────────────────
const MAX_HISTORY = 50;
let configHistory: ExhibitConfig[] = [];
let historyIndex = -1;

function pushToHistory(config: ExhibitConfig): void {
    // Trim future entries when branching from an earlier point
    configHistory = configHistory.slice(0, historyIndex + 1);
    configHistory.push(structuredClone(config));
    if (configHistory.length > MAX_HISTORY) configHistory.shift();
    historyIndex = configHistory.length - 1;
}

function resetHistory(): void {
    configHistory = [];
    historyIndex = -1;
}

interface EditorState {
    /** The current exhibit config from Firestore. */
    config: ExhibitConfig | null;
    /** Currently selected variant ID in the viewer. */
    activeVariantId: string | undefined;
    /** Currently focused hotspot ID. */
    activeHotspotId: string | null;
    /** ID of the model currently selected for PivotControls editing. */
    selectedModelId: string | null;
    /** The name of the mesh last clicked in the 3D viewer (for quick variant targeting). */
    pickedMeshName: string | null;
    /** Ambient light intensity for editor + embed lighting control. */
    ambientIntensity: number;
    /** Firestore save status. */
    saveStatus: SaveStatus;
    /** Error message when saveStatus is "error". */
    saveError: string | null;
    /** Counter to trigger entry-animation replay (increment to replay). */
    animationReplayKey: number;

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
    /** Store the name of a mesh picked in 3D. */
    setPickedMeshName: (meshName: string | null) => void;
    /** Set ambient light intensity for the viewer. */
    setAmbientIntensity: (value: number) => void;
    /** Update the save status indicator. */
    setSaveStatus: (status: SaveStatus, error?: string) => void;
    /** Trigger a replay of the entry animation. */
    replayAnimation: () => void;
    /** Undo the last config change. */
    undo: () => void;
    /** Redo a previously undone change. */
    redo: () => void;
    /** Whether undo is available. */
    canUndo: () => boolean;
    /** Whether redo is available. */
    canRedo: () => boolean;
    /** Reset editor state (called on unmount). */
    reset: () => void;
}

const initialState = {
    config: null,
    activeVariantId: undefined,
    activeHotspotId: null,
    selectedModelId: null,
    pickedMeshName: null,
    ambientIntensity: DEFAULT_AMBIENT_INTENSITY,
    animationReplayKey: 0,
    saveStatus: "idle" as SaveStatus,
    saveError: null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
    ...initialState,

    setConfig: (config, ambientIntensity) => {
        const current = get().config;
        const nextAmbient =
            ambientIntensity !== undefined
                ? sanitizeAmbientIntensity(ambientIntensity)
                : config.ambientIntensity !== undefined
                    ? sanitizeAmbientIntensity(config.ambientIntensity)
                    : get().ambientIntensity;

        if (
            current &&
            current.id === config.id &&
            JSON.stringify(current) === JSON.stringify(config) &&
            nextAmbient === get().ambientIntensity
        ) {
            return;
        }

        // Reset history when a new config is loaded (initial load or exhibit switch)
        resetHistory();
        pushToHistory(config);

        set({
            config,
            activeVariantId: get().activeVariantId ?? config.model.variants[0]?.id,
            ambientIntensity: nextAmbient,
        });
    },

    updateConfig: (partial) => {
        const current = get().config;
        if (!current) return;
        const nextConfig: ExhibitConfig = {
            ...current,
            ...partial,
            model: partial.model
                ? { ...current.model, ...partial.model }
                : current.model,
        };
        pushToHistory(nextConfig);
        set({ config: nextConfig });
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

    setPickedMeshName: (meshName) => {
        set({ pickedMeshName: meshName });
    },

    setAmbientIntensity: (value) => {
        set({ ambientIntensity: sanitizeAmbientIntensity(value) });
    },

    setSaveStatus: (status, error) => {
        set({ saveStatus: status, saveError: error ?? null });
    },

    replayAnimation: () => {
        set((state) => ({ animationReplayKey: state.animationReplayKey + 1 }));
    },

    undo: () => {
        if (historyIndex <= 0) return;
        historyIndex--;
        set({ config: structuredClone(configHistory[historyIndex]) });
    },

    redo: () => {
        if (historyIndex >= configHistory.length - 1) return;
        historyIndex++;
        set({ config: structuredClone(configHistory[historyIndex]) });
    },

    canUndo: () => historyIndex > 0,
    canRedo: () => historyIndex < configHistory.length - 1,

    reset: () => {
        resetHistory();
        set(initialState);
    },
}));
