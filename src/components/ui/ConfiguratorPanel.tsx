"use client";

import { useEditorStore } from "@/store/editorStore";

export function ConfiguratorPanel() {
  const config = useEditorStore((state) => state.config);
  const activeVariantId = useEditorStore((state) => state.activeVariantId);
  const setActiveVariant = useEditorStore((state) => state.setActiveVariant);

  if (!config) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white/95 p-4 text-sm text-zinc-800 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        Loading exhibition…
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white/95 p-4 text-zinc-800 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight">{config.title}</h2>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Material Variants
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {config.model.variants.map((variant) => {
          const isActive = activeVariantId === variant.id;
          const colorSwatch = variant.color ?? "#d1d5db";

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => setActiveVariant(variant.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all ${isActive
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                }`}
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600"
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
