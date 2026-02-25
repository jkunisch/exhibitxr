import { redirect } from "next/navigation";
import Link from "next/link";

import { SignOutButton } from "@/components/ui/SignOutButton";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_5%_0%,rgba(14,165,233,0.2),transparent_45%),radial-gradient(90%_90%_at_100%_100%,rgba(56,189,248,0.16),transparent_52%),linear-gradient(180deg,#020617_0%,#0f172a_60%,#111827_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/8 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">
                ExhibitXR Kontrollraum
              </h1>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">
                Tenant: {sessionUser.tenantId}
                {sessionUser.email ? ` • ${sessionUser.email}` : ""}
              </p>
            </div>
            <SignOutButton />
          </div>
          <nav className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
            >
              Übersicht
            </Link>
            <Link
              href="/dashboard/exhibitions"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
            >
              Ausstellungen
            </Link>
            <Link
              href="/dashboard/billing"
              className="rounded-lg border border-cyan-200/40 bg-cyan-300/20 px-3 py-2 text-xs font-medium text-cyan-50 transition hover:bg-cyan-300/30"
            >
              Abrechnung
            </Link>
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
