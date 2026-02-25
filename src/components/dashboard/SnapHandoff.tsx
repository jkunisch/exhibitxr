"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createExhibitionAction } from "@/app/actions/exhibitions";
import { Loader2 } from "lucide-react";

const PENDING_SNAP_KEY = "pending_snap_url";
const HANDOFF_LOCK_KEY = "pending_snap_handoff_lock";
const HANDOFF_LOCK_TTL_MS = 120_000;

function acquireHandoffLock(): boolean {
  try {
    const now = Date.now();
    const existingLockRaw = sessionStorage.getItem(HANDOFF_LOCK_KEY);
    const existingLockTime = existingLockRaw ? Number.parseInt(existingLockRaw, 10) : Number.NaN;

    if (Number.isFinite(existingLockTime) && now - existingLockTime < HANDOFF_LOCK_TTL_MS) {
      return false;
    }

    sessionStorage.setItem(HANDOFF_LOCK_KEY, String(now));
    return true;
  } catch {
    // Best effort fallback if sessionStorage is unavailable.
    return true;
  }
}

function releaseHandoffLock() {
  try {
    sessionStorage.removeItem(HANDOFF_LOCK_KEY);
  } catch {
    // Ignore cleanup errors.
  }
}

export default function SnapHandoff() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let isActive = true;

    const processPendingSnap = async () => {
      const pendingUrl = localStorage.getItem(PENDING_SNAP_KEY);
      if (!pendingUrl) return;
      if (!acquireHandoffLock()) {
        if (isActive) {
          window.setTimeout(() => {
            if (isActive) {
              setRetryToken((previous) => previous + 1);
            }
          }, 1500);
        }
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("title", "Mein 3D-Snap");
        formData.append("description", "Automatisch aus dem Startseiten-Workflow importiert.");
        formData.append("environment", "studio");
        formData.append("glbUrl", pendingUrl);

        const result = await createExhibitionAction(formData);

        if (result.ok) {
          const editorUrl = `/dashboard/editor/${result.exhibitionId}`;
          localStorage.removeItem(PENDING_SNAP_KEY);
          releaseHandoffLock();

          // In dev strict-mode remounts, success may resolve after unmount.
          // Always force navigation so handoff never gets "stuck" on dashboard.
          if (isActive) {
            router.replace(editorUrl);
            window.setTimeout(() => {
              window.location.assign(editorUrl);
            }, 1200);
          } else {
            window.location.assign(editorUrl);
          }
        } else {
          if (!isActive) return;
          console.error("SnapHandoff Error:", result.error);
          setError(result.error);
        }
      } catch (error) {
        if (!isActive) return;
        console.error("SnapHandoff Exception:", error);
        setError("Studio-Import fehlgeschlagen. Bitte erneut versuchen.");
      } finally {
        releaseHandoffLock();
        if (isActive) {
          setIsProcessing(false);
        }
      }
    };

    processPendingSnap();

    return () => {
      isActive = false;
    };
  }, [retryToken, router]);

  if (!isProcessing && !error) return null;

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-6 text-white backdrop-blur-sm">
        <h3 className="text-2xl font-black tracking-tight">Snap-Import fehlgeschlagen</h3>
        <p className="mt-3 max-w-lg text-center text-zinc-300">{error}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setRetryToken((previous) => previous + 1)}
            className="rounded-xl bg-[#00aaff] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0090dd]"
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(PENDING_SNAP_KEY);
              setError(null);
            }}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white backdrop-blur-sm">
      <Loader2 className="w-12 h-12 text-[#00aaff] animate-spin mb-6" />
      <h3 className="text-2xl font-black tracking-tight">Studio wird vorbereitet</h3>
      <p className="text-zinc-400 mt-2 font-medium">Dein Modell wird in das Lighting Studio geladen...</p>
    </div>
  );
}
