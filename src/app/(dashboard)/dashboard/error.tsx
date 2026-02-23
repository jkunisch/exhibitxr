"use client";

type DashboardErrorProps = {
  error: Error;
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <section className="rounded-2xl border border-rose-200/30 bg-rose-500/10 p-5 backdrop-blur-xl sm:p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-rose-100/80">
        Dashboard Error
      </p>
      <h2 className="mt-1 text-xl font-semibold text-white">
        Could not load exhibitions
      </h2>
      <p className="mt-3 text-sm text-rose-100/90">
        {error.message || "Unknown error."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl border border-rose-100/35 bg-rose-400/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400/30"
      >
        Retry
      </button>
    </section>
  );
}
