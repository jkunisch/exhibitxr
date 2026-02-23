import { create } from "zustand";

export type ExhibitVariantOption = {
  id: string;
  name: string;
  description?: string;
  swatchHex?: string;
};

export type ExhibitVariant = {
  id: string;
  name: string;
  options: ExhibitVariantOption[];
  defaultOptionId?: string;
};

export type ExhibitHotspot = {
  id: string;
  title: string;
  description: string;
  position: {
    x: number;
    y: number;
  };
};

export type ExhibitConfig = {
  id: string;
  title: string;
  subtitle?: string;
  variants: ExhibitVariant[];
  hotspots: ExhibitHotspot[];
};

type ActiveVariants = Record<string, string>;

type ExhibitState = {
  config: ExhibitConfig | null;
  activeVariants: ActiveVariants;
  selectedHotspot: ExhibitHotspot | null;
  setConfig: (config: ExhibitConfig) => void;
  setVariant: (variantId: string, optionId: string) => void;
  selectHotspot: (hotspotId: string) => void;
  clearHotspot: () => void;
};

const buildInitialActiveVariants = (config: ExhibitConfig): ActiveVariants => {
  const result: ActiveVariants = {};

  for (const variant of config.variants) {
    const firstOptionId = variant.options[0]?.id;
    const activeOptionId = variant.defaultOptionId ?? firstOptionId;

    if (activeOptionId) {
      result[variant.id] = activeOptionId;
    }
  }

  return result;
};

export const useExhibitStore = create<ExhibitState>((set, get) => ({
  config: null,
  activeVariants: {},
  selectedHotspot: null,
  setConfig: (config) => {
    set({
      config,
      activeVariants: buildInitialActiveVariants(config),
      selectedHotspot: null,
    });
  },
  setVariant: (variantId, optionId) => {
    const config = get().config;

    if (!config) {
      return;
    }

    const variant = config.variants.find((item) => item.id === variantId);
    const optionExists = variant?.options.some((option) => option.id === optionId);

    if (!optionExists) {
      return;
    }

    set((state) => ({
      activeVariants: {
        ...state.activeVariants,
        [variantId]: optionId,
      },
    }));
  },
  selectHotspot: (hotspotId) => {
    const hotspot = get().config?.hotspots.find((item) => item.id === hotspotId) ?? null;
    set({ selectedHotspot: hotspot });
  },
  clearHotspot: () => {
    set({ selectedHotspot: null });
  },
}));
