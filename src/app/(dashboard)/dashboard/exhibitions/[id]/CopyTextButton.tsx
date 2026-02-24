"use client";

import { useState } from "react";

type CopyTextButtonProps = {
  value: string;
};

export default function CopyTextButton({ value }: CopyTextButtonProps) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("done");
      window.setTimeout(() => {
        setStatus("idle");
      }, 1500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-3 py-2 text-xs font-medium text-cyan-50 transition hover:bg-cyan-300/25"
    >
      {status === "idle" ? "Kopieren" : null}
      {status === "done" ? "Kopiert!" : null}
      {status === "error" ? "Fehler beim Kopieren" : null}
    </button>
  );
}
