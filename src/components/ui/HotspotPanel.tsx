"use client";

import { useExhibitStore } from "../../store/exhibit";

const PANEL_CLASS_NAME =
  "bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl";

export function HotspotPanel() {
  const config = useExhibitStore((state) => state.config);
  const selectedHotspotId = useExhibitStore((state) => state.selectedHotspotId);
  const clearHotspot = useExhibitStore((state) => state.clearHotspot);
  const selectedHotspot = config?.model.hotspots.find((state) => state.id === selectedHotspotId) ?? null;

  if (!selectedHotspot) {
    return null;
  }

  return (
    <section className={`${PANEL_CLASS_NAME} p-4 text-slate-800 dark:text-slate-100`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{selectedHotspot.label}</h3>
        <button
          type="button"
          onClick={clearHotspot}
          className="rounded-full border border-slate-700/30 bg-white/60 px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-white dark:border-white/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/40"
          aria-label="Close hotspot details"
        >
          Close
        </button>
      </div>
      {selectedHotspot.description ? (
        <p className="text-sm leading-relaxed text-slate-700/90 dark:text-slate-200/90">
          {selectedHotspot.description}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700/90 dark:text-slate-200/90">No details available.</p>
      )}
    </section>
  );
}
