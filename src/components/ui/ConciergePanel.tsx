"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Clock, Loader2, PartyPopper } from "lucide-react";
import { createConciergeOrder } from "@/app/actions/upsell";

interface ConciergePanelProps {
  exhibitId: string;
  initialStatus?: string;
}

export function ConciergePanel({ exhibitId, initialStatus = "none" }: ConciergePanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrder = async () => {
    setIsOrdering(true);
    setError(null);
    try {
      const result = await createConciergeOrder(exhibitId);
      if (result.ok) {
        setStatus("ordered");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsOrdering(false);
    }
  };

  if (status === "ordered") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <PartyPopper className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">Auftrag erhalten!</h3>
        <p className="text-sm text-emerald-100/80 leading-relaxed">
          Einer unserer 3D-Experten wird dein Modell nun manuell optimieren.
          Wir benachrichtigen dich per E-Mail, sobald das Ergebnis fertig ist (ca. 24-48h).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
          <Sparkles className="h-3 w-3" />
          Premium Service
        </div>
        <h3 className="text-xl font-bold text-white">Make it Perfect</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Die KI generiert ein gutes Basismodell aus deinem Foto.
          Unser Concierge-Service geht einen Schritt weiter: Ein 3D-Artist
          überarbeitet dein Modell manuell — für makellose Texturen,
          optimierte Performance und professionelle Qualität.
        </p>
      </header>

      <div className="mb-6 rounded-lg border border-purple-400/15 bg-purple-500/5 px-4 py-3">
        <p className="text-xs font-medium text-purple-200/90">So funktioniert&apos;s:</p>
        <ol className="mt-2 space-y-1 text-xs text-white/55">
          <li>1. Lade ein Foto hoch im &quot;Foto → 3D&quot; Tab</li>
          <li>2. Die KI generiert dein 3D-Modell automatisch</li>
          <li>3. Bestelle hier den Concierge-Feinschliff</li>
          <li>4. Unser Artist liefert das optimierte Modell in 24-48h</li>
        </ol>
      </div>

      <ul className="mb-8 space-y-4">
        {[
          { icon: <ShieldCheck className="h-4 w-4 text-purple-400" />, text: "Manuelle Textur-Korrektur & PBR-Feinschliff" },
          { icon: <CheckCircle2 className="h-4 w-4 text-purple-400" />, text: "Optimiertes Mesh für maximale Lade-Performance" },
          { icon: <Clock className="h-4 w-4 text-purple-400" />, text: "Lieferung innerhalb von 24-48 Stunden" },
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-white/80">
            <span className="mt-0.5 shrink-0">{item.icon}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-4">
        <button
          onClick={handleOrder}
          disabled={isOrdering}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 p-px font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-70"
        >
          <div className="flex items-center justify-center gap-2 rounded-[11px] bg-zinc-950/20 px-4 py-3 transition-colors group-hover:bg-transparent">
            {isOrdering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bearbeite Bestellung...
              </>
            ) : (
              <>
                Jetzt bestellen — 49 €
              </>
            )}
          </div>
        </button>

        {error && (
          <p className="text-center text-xs text-rose-400 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}

        <p className="text-center text-[11px] text-white/40">
          Einmalige Zahlung pro Modell. Rechnung folgt per E-Mail.
        </p>
      </div>
    </div>
  );
}
