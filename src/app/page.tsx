"use client";

import { useEffect, useMemo, useRef } from "react";
import type CameraControlsImpl from "camera-controls";

import ViewerCanvas from "@/components/3d/ViewerCanvas";
import ModelViewer from "@/components/3d/ModelViewer";
import { ConfiguratorPanel } from "@/components/ui/ConfiguratorPanel";
import { HotspotPanel } from "@/components/ui/HotspotPanel";
import { demoConfig } from "@/data/demo";
import { parseExhibitConfig } from "@/lib/validateConfig";
import { useExhibitStore } from "@/store/exhibit";

export default function HomePage() {
  const cameraRef = useRef<CameraControlsImpl | null>(null);
  const setConfig = useExhibitStore((state) => state.setConfig);
  const config = useExhibitStore((state) => state.config);
  const activeVariantId = useExhibitStore((state) => state.activeVariantId);
  const selectedHotspotId = useExhibitStore((state) => state.selectedHotspotId);
  const selectHotspot = useExhibitStore((state) => state.selectHotspot);

  const parsedConfig = useMemo(() => {
    try {
      return { data: parseExhibitConfig(demoConfig), error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown config validation error.";
      return { data: null, error: message };
    }
  }, []);

  useEffect(() => {
    if (parsedConfig.data) {
      setConfig(parsedConfig.data);
    }
  }, [parsedConfig.data, setConfig]);

  useEffect(() => {
    if (!config || !selectedHotspotId || !cameraRef.current) {
      return;
    }

    const hotspot = config.model.hotspots.find((item) => item.id === selectedHotspotId);
    if (!hotspot?.cameraPosition || !hotspot.cameraTarget) {
      return;
    }

    const [px, py, pz] = hotspot.cameraPosition;
    const [tx, ty, tz] = hotspot.cameraTarget;
    cameraRef.current.setLookAt(px, py, pz, tx, ty, tz, true);
  }, [config, selectedHotspotId]);

  if (parsedConfig.error) {
    return (
      <main className="grid h-dvh w-full place-items-center bg-black p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-rose-300/45 bg-rose-500/10 p-5">
          <h1 className="text-lg font-semibold">Invalid Exhibit Config</h1>
          <pre className="mt-3 overflow-auto text-xs leading-relaxed text-rose-100/85">{parsedConfig.error}</pre>
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="grid h-dvh w-full place-items-center bg-slate-950 text-white">
        Loading viewer...
      </main>
    );
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-950 text-white">
      <ViewerCanvas
        environment={config.environment}
        contactShadows={config.contactShadows}
        bgColor={config.bgColor}
        cameraPosition={config.cameraPosition}
        cameraControlsRef={cameraRef}
        className="h-full w-full"
      >
        <ambientLight intensity={0.45} />
        <ModelViewer
          config={config.model}
          activeVariantId={activeVariantId}
          onHotspotClick={selectHotspot}
        />
      </ViewerCanvas>

      <div className="pointer-events-none absolute inset-0 p-4 md:p-6">
        <div className="pointer-events-auto inline-flex rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-medium tracking-[0.18em] text-white/90 backdrop-blur-md">
          EXHIBITXR DEMO
        </div>

        <div className="pointer-events-auto mt-4 max-w-sm">
          <ConfiguratorPanel />
        </div>

        <div className="pointer-events-auto mt-4 ml-auto max-w-sm">
          <HotspotPanel />
        </div>
      </div>
    </main>
  );
}
