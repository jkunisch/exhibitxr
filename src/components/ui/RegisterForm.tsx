"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";

import {
  createSessionCookieAction,
  registerTenantAndSession,
  type SessionActionResult,
} from "@/app/actions/auth";
import { auth } from "@/lib/firebase";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Registration failed. Please try again.";
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const companyName = formData.get("companyName");
    const email = formData.get("email");
    const password = formData.get("password");

    if (
      typeof companyName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      setError("Please provide company name, email, and password.");
      return;
    }

    startTransition(async () => {
      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const { user } = credential;

        // Initial token before claims are set server-side.
        const initialToken = await user.getIdToken();
        const registerResult = await registerTenantAndSession(
          initialToken,
          companyName.trim(),
        );

        if (!registerResult.ok) {
          setError(registerResult.error);
          return;
        }

        // Critical: refresh token to pull newly set custom claims.
        const refreshedToken = await user.getIdToken(true);
        const sessionResult: SessionActionResult =
          await createSessionCookieAction(refreshedToken);

        if (!sessionResult.ok) {
          setError(sessionResult.error);
          return;
        }

        router.replace("/dashboard");
        router.refresh();
      } catch (submitError) {
        setError(getErrorMessage(submitError));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="companyName"
          className="text-sm font-medium text-white/80"
        >
          Company Name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          autoComplete="organization"
          required
          className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/35"
          placeholder="Acme GmbH"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-white/80">
          Business Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/35"
          placeholder="you@company.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-white/80"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/35"
          placeholder="At least 8 characters"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl border border-cyan-300/55 bg-cyan-300/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-xs text-white/60">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-cyan-200/90 underline decoration-cyan-200/55 underline-offset-2 hover:text-cyan-100"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
