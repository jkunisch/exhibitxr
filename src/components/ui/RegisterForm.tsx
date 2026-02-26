"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";

import {
  createSessionCookieAction,
  registerTenantFromGoogle,
  type SessionActionResult,
} from "@/app/actions/auth";
import { auth } from "@/lib/firebase";

function getAuthErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function getErrorMessage(error: unknown): string {
  const code = getAuthErrorCode(error);
  if (code) {
    switch (code) {
      case "auth/popup-closed-by-user":
        return "Anmeldung abgebrochen.";
      case "auth/account-exists-with-different-credential":
        return "Dieses Konto existiert bereits mit einer anderen Anmeldemethode.";
      case "auth/operation-not-allowed":
        return "Google-Anmeldung ist derzeit nicht aktiviert.";
      case "auth/unauthorized-domain":
        return "Diese Domain ist nicht fuer Google-Login autorisiert.";
      case "auth/network-request-failed":
        return "Netzwerkfehler bei der Anmeldung. Bitte erneut versuchen.";
      default:
        break;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Registrierung fehlgeschlagen. Bitte erneut versuchen.";
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const completeRegistration = useCallback(
    async (user: User) => {
      const initialToken = await user.getIdToken();
      const registerResult = await registerTenantFromGoogle(initialToken);

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
    },
    [router],
  );

  const handleGoogleSignup = useCallback(async () => {
    setError(null);
    setIsPending(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const credential = await signInWithPopup(auth, provider);
      await completeRegistration(credential.user);
    } catch (submitError) {
      const code = getAuthErrorCode(submitError);
      if (code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
        return;
      }

      setError(getErrorMessage(submitError));
    } finally {
      setIsPending(false);
    }
  }, [completeRegistration]);

  useEffect(() => {
    let isMounted = true;

    const handleRedirectResult = async () => {
      setIsPending(true);
      try {
        const credential = await getRedirectResult(auth);
        if (!credential || !isMounted) {
          return;
        }

        await completeRegistration(credential.user);
      } catch (redirectError) {
        if (isMounted) {
          setError(getErrorMessage(redirectError));
        }
      } finally {
        if (isMounted) {
          setIsPending(false);
        }
      }
    };

    void handleRedirectResult();

    return () => {
      isMounted = false;
    };
  }, [completeRegistration]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          void handleGoogleSignup();
        }}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.49-1.72 4.38-5.27 4.38-3.17 0-5.75-2.62-5.75-5.85s2.58-5.85 5.75-5.85c1.8 0 3 0.77 3.69 1.43l2.52-2.43C16.77 4.18 14.67 3.2 12.17 3.2 7.2 3.2 3.17 7.27 3.17 12.3s4.03 9.1 9 9.1c5.2 0 8.65-3.65 8.65-8.8 0-.6-.06-1.04-.15-1.5z"
            fill="currentColor"
          />
        </svg>
        {isPending ? "Google-Anmeldung laeuft..." : "Mit Google fortfahren"}
      </button>

      {error ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <p className="text-center text-xs text-white/60">
        Bereits registriert?{" "}
        <Link
          href="/login"
          className="font-medium text-cyan-200/90 underline decoration-cyan-200/55 underline-offset-2 hover:text-cyan-100"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
