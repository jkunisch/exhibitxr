import { redirect } from "next/navigation";
import Link from "next/link";

import { LoginForm } from "@/components/ui/LoginForm";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

function normalizeNextPath(input: string | string[] | undefined): string {
  if (typeof input !== "string") {
    return "/dashboard";
  }

  if (!input.startsWith("/") || input.startsWith("//")) {
    return "/dashboard";
  }

  return input;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizeNextPath(resolvedSearchParams.next);
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(nextPath);
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_12%_20%,rgba(14,165,233,0.3),transparent_50%),radial-gradient(100%_100%_at_90%_80%,rgba(34,211,238,0.22),transparent_54%),linear-gradient(160deg,#020617,#0f172a)]" />
      <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-28 right-8 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/8 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-8">
        <Link
          href="/"
          className="inline-flex text-xs font-medium text-cyan-100/90 underline decoration-cyan-200/45 underline-offset-2 hover:text-cyan-100"
        >
          Zurueck zur Startseite
        </Link>

        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
          3D-Snap Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Willkommen zurueck
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Melde dich mit Google an, um dein Dashboard und deine Ausstellungen zu
          oeffnen.
        </p>

        <div className="mt-8">
          <LoginForm nextPath={nextPath} />
        </div>

        <p className="mt-4 text-center text-xs text-white/60">
          Noch kein Konto?{" "}
          <Link
            href="/register"
            className="font-medium text-cyan-200/90 underline decoration-cyan-200/55 underline-offset-2 hover:text-cyan-100"
          >
            Jetzt registrieren
          </Link>
        </p>

        <p className="mt-5 text-xs text-white/60">
          Beim Login werden Claims mit `await user.getIdToken(true)`
          aktualisiert, bevor die Session aufgebaut wird.
        </p>
      </section>
    </main>
  );
}
