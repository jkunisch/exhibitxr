import { create } from "zustand";
import type { ExhibitConfig } from "@/types/schema";

type ExhibitState = {
  config: ExhibitConfig | null;
  activeVariantId: string | undefined;
  selectedHotspotId: string | null;
  setConfig: (config: ExhibitConfig) => void;
  setVariant: (variantId: string) => void;
  selectHotspot: (hotspotId: string) => void;
  clearHotspot: () => void;
};

export const useExhibitStore = create<ExhibitState>((set, get) => ({
  config: null,
  activeVariantId: undefined,
  selectedHotspotId: null,
  setConfig: (config) => {
    set({
      config,
      activeVariantId: config.model.variants[0]?.id,
      selectedHotspotId: null,
    });
  },
  setVariant: (variantId) => {
    const config = get().config;
    if (!config) {
      return;
    }

    const variantExists = config.model.variants.some((item) => item.id === variantId);
    if (!variantExists) {
      return;
    }

    set({ activeVariantId: variantId });
  },
  selectHotspot: (hotspotId) => {
    const hotspotExists = get().config?.model.hotspots.some((item) => item.id === hotspotId) ?? false;
    set({ selectedHotspotId: hotspotExists ? hotspotId : null });
  },
  clearHotspot: () => {
    set({ selectedHotspotId: null });
  },
}));
