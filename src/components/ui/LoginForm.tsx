"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";

import {
  createSessionCookieAction,
  type SessionActionResult,
} from "@/app/actions/auth";
import { auth } from "@/lib/firebase";

type LoginFormProps = {
  nextPath: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Login failed. Please try again.";
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      setError("Please provide email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const { user } = credential;

        // Force a token refresh so freshly set custom claims are available.
        await user.getIdToken(true);
        const tokenResult = await user.getIdTokenResult();
        const tenantId =
          typeof tokenResult.claims.tenantId === "string"
            ? tokenResult.claims.tenantId
            : null;

        if (!tenantId) {
          setError(
            "Account has no tenant claim yet. Please complete onboarding or contact support.",
          );
          return;
        }

        const sessionResult: SessionActionResult = await createSessionCookieAction(
          tokenResult.token,
        );

        if (!sessionResult.ok) {
          setError(sessionResult.error);
          return;
        }

        router.replace(nextPath);
        router.refresh();
      } catch (submitError) {
        setError(getErrorMessage(submitError));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/35"
          placeholder="Your password"
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
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
