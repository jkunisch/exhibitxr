"use client";

import { useEffect } from "react";

import { ConfiguratorPanel } from "../components/ui/ConfiguratorPanel";
import { HotspotPanel } from "../components/ui/HotspotPanel";
import {
  type ExhibitConfig,
  type ExhibitHotspot,
  type ExhibitVariant,
  useExhibitStore,
} from "../store/exhibit";

const DEMO_CONFIG: ExhibitConfig = {
  id: "demo-exhibit",
  title: "Axiom Concept Coupe",
  subtitle: "Interactive premium showroom viewer",
  variants: [
    {
      id: "paint",
      name: "Paint",
      defaultOptionId: "obsidian",
      options: [
        { id: "obsidian", name: "Obsidian Black", swatchHex: "#151516" },
        { id: "arctic", name: "Arctic Silver", swatchHex: "#bdc7d6" },
        { id: "flare", name: "Solar Flare", swatchHex: "#ff5f3a" },
      ],
    },
    {
      id: "interior",
      name: "Interior",
      defaultOptionId: "carbon",
      options: [
        { id: "carbon", name: "Carbon Weave" },
        { id: "linen", name: "Linen Performance" },
      ],
    },
  ],
  hotspots: [
    {
      id: "front-lightbar",
      title: "Adaptive Lightbar",
      description: "Matrix LED segments blend daytime identity lighting with active steering-aware projection.",
      position: { x: 24, y: 44 },
    },
    {
      id: "cockpit",
      title: "Immersive Cockpit",
      description: "Panoramic HUD and a 3-layer dashboard stack keep critical controls in direct line of sight.",
      position: { x: 58, y: 55 },
    },
    {
      id: "rear-diffuser",
      title: "Active Aero Diffuser",
      description: "The rear diffuser modulates airflow to stabilize high-speed cornering and reduce drag.",
      position: { x: 76, y: 62 },
    },
  ],
};

type SceneStageProps = {
  hotspots: ExhibitHotspot[];
  selectedHotspotId: string | null;
  variants: ExhibitVariant[];
  activeVariants: Record<string, string>;
  onSelectHotspot: (hotspotId: string) => void;
};

function SceneStage({
  hotspots,
  selectedHotspotId,
  variants,
  activeVariants,
  onSelectHotspot,
}: SceneStageProps) {
  const variantSummary = variants
    .map((variant) => {
      const activeOptionId = activeVariants[variant.id] ?? variant.defaultOptionId ?? variant.options[0]?.id;
      const activeOptionName = variant.options.find((option) => option.id === activeOptionId)?.name ?? "Not set";
      return `${variant.name}: ${activeOptionName}`;
    })
    .join("  |  ");

  return (
    <section className="relative h-full w-full overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_70%_20%,rgba(59,130,246,0.38),transparent_55%),radial-gradient(90%_90%_at_20%_80%,rgba(14,165,233,0.35),transparent_55%),linear-gradient(145deg,#020617_20%,#0f172a_100%)]" />
      <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="absolute left-5 top-5 z-10 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm md:left-8 md:top-8">
        3D Stage Preview
      </div>
      <div className="absolute bottom-4 left-4 right-4 z-10 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/80 backdrop-blur-sm md:bottom-8 md:left-8 md:right-auto md:max-w-[70ch]">
        {variantSummary}
      </div>

      {hotspots.map((hotspot) => {
        const isSelected = hotspot.id === selectedHotspotId;

        return (
          <button
            key={hotspot.id}
            type="button"
            onClick={() => onSelectHotspot(hotspot.id)}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm transition ${
              isSelected
                ? "border-cyan-300/90 bg-cyan-300/30 text-white shadow-[0_0_24px_rgba(34,211,238,0.55)]"
                : "border-white/40 bg-black/35 text-white hover:bg-white/20"
            }`}
            style={{
              left: `${hotspot.position.x}%`,
              top: `${hotspot.position.y}%`,
            }}
            aria-label={`Open hotspot ${hotspot.title}`}
          >
            {hotspot.title}
          </button>
        );
      })}
    </section>
  );
}

export default function Page() {
  const setConfig = useExhibitStore((state) => state.setConfig);
  const config = useExhibitStore((state) => state.config);
  const activeVariants = useExhibitStore((state) => state.activeVariants);
  const selectedHotspotId = useExhibitStore((state) => state.selectedHotspot?.id ?? null);
  const selectHotspot = useExhibitStore((state) => state.selectHotspot);

  useEffect(() => {
    setConfig(DEMO_CONFIG);
  }, [setConfig]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-950 text-white">
      <SceneStage
        hotspots={config?.hotspots ?? []}
        selectedHotspotId={selectedHotspotId}
        variants={config?.variants ?? []}
        activeVariants={activeVariants}
        onSelectHotspot={selectHotspot}
      />

      <div className="pointer-events-none absolute inset-0 p-4 md:p-8">
        <div className="pointer-events-auto max-w-md">
          <ConfiguratorPanel />
        </div>
        <div className="pointer-events-auto mt-4 max-w-md md:ml-auto md:mt-6">
          <HotspotPanel />
        </div>
      </div>
    </main>
  );
}
