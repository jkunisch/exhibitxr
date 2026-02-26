import { redirect } from "next/navigation";
import Link from "next/link";

import { RegisterForm } from "@/components/ui/RegisterForm";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect("/dashboard");
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
          3D-Snap Registrierung
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Mit Google starten
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Erstelle dein Konto und richte dein Studio ein.
        </p>

        <div className="mt-8">
          <RegisterForm />
        </div>

        <p className="mt-5 text-xs text-white/60">
          Mit der Anmeldung akzeptierst du unsere Nutzungsbedingungen.
        </p>
      </section>
    </main>
  );
}
