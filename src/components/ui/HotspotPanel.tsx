"use client";

import { useExhibitStore } from "../../store/exhibit";

const PANEL_CLASS_NAME =
  "bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl";

export function HotspotPanel() {
  const selectedHotspot = useExhibitStore((state) => state.selectedHotspot);
  const clearHotspot = useExhibitStore((state) => state.clearHotspot);

  if (!selectedHotspot) {
    return null;
  }

  return (
    <section className={`${PANEL_CLASS_NAME} p-4 text-slate-800 dark:text-slate-100`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{selectedHotspot.title}</h3>
        <button
          type="button"
          onClick={clearHotspot}
          className="rounded-full border border-slate-700/30 bg-white/60 px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-white dark:border-white/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/40"
          aria-label="Close hotspot details"
        >
          Close
        </button>
      </div>
      <p className="text-sm leading-relaxed text-slate-700/90 dark:text-slate-200/90">{selectedHotspot.description}</p>
    </section>
  );
}
