import type { ReactNode } from "react";

type GlassFormPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function GlassFormPanel({
  title,
  subtitle,
  children,
  footer,
}: GlassFormPanelProps) {
  return (
    <section className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-xl backdrop-blur-md dark:bg-black/50 sm:p-6">
      <header className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-700/80 dark:text-slate-200/80">
            {subtitle}
          </p>
        ) : null}
      </header>

      {children}

      {footer ? <footer className="mt-5">{footer}</footer> : null}
    </section>
  );
}

