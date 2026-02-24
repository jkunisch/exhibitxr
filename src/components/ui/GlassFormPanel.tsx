import type { ReactNode } from "react";

type GlassFormPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Solid enterprise-grade form panel.
 * Vercel/Linear-inspired: clean borders, no glass, minimal shadow.
 */
export function GlassFormPanel({
  title,
  subtitle,
  children,
  footer,
}: GlassFormPanelProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </header>

      {children}

      {footer ? <footer className="mt-5">{footer}</footer> : null}
    </section>
  );
}
