"use client";

import { useEditorStore } from "@/store/editorStore";

export function HotspotPanel() {
  const config = useEditorStore((state) => state.config);
  const activeHotspotId = useEditorStore((state) => state.activeHotspotId);
  const setActiveHotspot = useEditorStore((state) => state.setActiveHotspot);
  const selectedHotspot =
    config?.model.hotspots.find((h) => h.id === activeHotspotId) ?? null;

  if (!selectedHotspot) {
    return null;
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white/95 p-4 text-zinc-800 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">
          {selectedHotspot.label}
        </h3>
        <button
          type="button"
          onClick={() => setActiveHotspot(null)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Close hotspot details"
        >
          Close
        </button>
      </div>
      {selectedHotspot.description ? (
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {selectedHotspot.description}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          No details available.
        </p>
      )}
    </section>
  );
}
