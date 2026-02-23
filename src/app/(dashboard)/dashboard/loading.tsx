export default function DashboardLoading() {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
        Exhibitions
      </p>
      <h2 className="mt-1 text-xl font-semibold text-white">
        Loading tenant data...
      </h2>

      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl border border-white/12 bg-black/25"
          />
        ))}
      </div>
    </section>
  );
}
