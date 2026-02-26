"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createExhibitionAction } from "@/app/actions/exhibitions";
import { Loader2 } from "lucide-react";

const PENDING_SNAP_KEY = "pending_snap_url";

export default function SnapHandoff() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Robust lock to prevent double-execution in React Strict Mode
  const hasImported = useRef(false);

  useEffect(() => {
    // Only run if there's a pending snap and we haven't already started importing it
    const pendingUrl = localStorage.getItem(PENDING_SNAP_KEY);
    if (!pendingUrl || hasImported.current) return;
    
    // Lock it immediately
    hasImported.current = true;

    const processPendingSnap = async () => {
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
        
                  // Smooth transition: Transition directly to the editor. 
                  // The backend path is already revalidated by the server action.
                  router.replace(editorUrl);
                } else {          console.error("SnapHandoff Error:", result.error);
          setError(result.error);
          // Unlock on failure so the user can hit 'retry'
          hasImported.current = false;
        }
      } catch (error) {
        console.error("SnapHandoff Exception:", error);
        setError("Studio-Import fehlgeschlagen. Bitte erneut versuchen.");
        hasImported.current = false;
      } finally {
        setIsProcessing(false);
      }
    };

    processPendingSnap();

  }, [router]);

  // Clean up: If the user manually retries after an error
  const handleRetry = () => {
    hasImported.current = false;
    setIsProcessing(false);
    setError(null);
    // This state change will trigger the useEffect again
  };

  if (!isProcessing && !error) return null;

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-6 text-white backdrop-blur-sm">
        <h3 className="text-2xl font-black tracking-tight">Snap-Import fehlgeschlagen</h3>
        <p className="mt-3 max-w-lg text-center text-zinc-300">{error}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleRetry}
            className="rounded-xl bg-[#00aaff] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0090dd]"
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(PENDING_SNAP_KEY);
              setError(null);
              // Unlock so the component hides
              hasImported.current = false; 
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
