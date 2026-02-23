"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

import { clearSessionCookieAction } from "@/app/actions/auth";
import { auth } from "@/lib/firebase";

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    setError(null);

    startTransition(async () => {
      try {
        await signOut(auth);
        await clearSessionCookieAction();

        router.replace("/login");
        router.refresh();
      } catch (signOutError) {
        if (signOutError instanceof Error) {
          setError(signOutError.message);
          return;
        }

        setError("Sign-out failed. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}
