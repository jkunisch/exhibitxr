"use client";

import { useExhibitStore } from "../../store/exhibit";

const PANEL_CLASS_NAME =
  "bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl";

export function ConfiguratorPanel() {
  const config = useExhibitStore((state) => state.config);
  const activeVariants = useExhibitStore((state) => state.activeVariants);
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
        {config.subtitle ? <p className="text-sm text-slate-700/80 dark:text-slate-200/80">{config.subtitle}</p> : null}
      </header>

      <div className="space-y-4">
        {config.variants.map((variant) => (
          <div key={variant.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700/80 dark:text-slate-200/80">
              {variant.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {variant.options.map((option) => {
                const isActive = activeVariants[variant.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setVariant(variant.id, option.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      isActive
                        ? "border-slate-900/60 bg-slate-900 text-white dark:border-white/60 dark:bg-white dark:text-black"
                        : "border-slate-500/30 bg-white/60 text-slate-900 hover:bg-white dark:border-white/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/40"
                    }`}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
