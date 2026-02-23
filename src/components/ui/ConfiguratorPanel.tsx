"use client";

import { useExhibitStore } from "../../store/exhibit";

const PANEL_CLASS_NAME =
  "bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl";

export function ConfiguratorPanel() {
  const config = useExhibitStore((state) => state.config);
  const activeVariantId = useExhibitStore((state) => state.activeVariantId);
  const setVariant = useExhibitStore((state) => state.setVariant);

  if (!config) {
    return (
      <section className={`${PANEL_CLASS_NAME} p-4 text-sm text-slate-800 dark:text-slate-100`}>
        Loading exhibition...
      </section>
    );
  }

  return (
    <section className={`${PANEL_CLASS_NAME} p-4 text-slate-800 dark:text-slate-100`}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{config.title}</h2>
        <p className="text-sm text-slate-700/80 dark:text-slate-200/80">Material Variants</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {config.model.variants.map((variant) => {
          const isActive = activeVariantId === variant.id;
          const colorSwatch = variant.color ?? "#d1d5db";

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => setVariant(variant.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                isActive
                  ? "border-slate-900/60 bg-slate-900 text-white dark:border-white/60 dark:bg-white dark:text-black"
                  : "border-slate-500/30 bg-white/60 text-slate-900 hover:bg-white dark:border-white/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/40"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10 dark:border-white/20"
                style={{ backgroundColor: colorSwatch }}
                aria-hidden
              />
              <span className="truncate">{variant.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
