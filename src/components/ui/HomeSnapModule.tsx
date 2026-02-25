'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import EmbedViewer from '@/components/3d/EmbedViewer';

export default function HomeSnapModule() {
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Das Bild ist zu groß (max. 10MB).");
      setStatus('ERROR');
      return;
    }

    setStatus('UPLOADING');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Hier rufen wir unsere Server Action auf
      const response = await fetch('/api/snap-preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Upload fehlgeschlagen.");
      }

      const { taskId } = await response.json();

      setStatus('PROCESSING');

      // Polling Logic
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/snap-preview/${taskId}`);
          const data = await pollRes.json();

          setProgress((prev) => Math.max(prev, data.progress || 0));

          if (data.status === 'SUCCEEDED') {
            clearInterval(pollInterval);
            setModelUrl(data.glbUrl);
            setStatus('SUCCESS');
          } else if (data.status === 'FAILED') {
            clearInterval(pollInterval);
            setError("Die KI konnte kein Modell erstellen. Bitte anderes Foto probieren.");
            setStatus('ERROR');
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler beim Starten des Snaps.";
      setError(msg);
      setStatus('ERROR');
    }
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 relative">
      <AnimatePresence mode="wait">

        {/* IDLE: Initialer Upload-State */}
        {status === 'IDLE' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center"
          >
            <div className="mb-8 relative inline-block">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group cursor-pointer hover:bg-white/10 transition-all">
                <Camera className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Einfach Foto hochladen.</h2>
            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Erleben Sie die 3D-Snap Pipeline live. Ziehen Sie ein Produktfoto hierher oder klicken Sie auf das Icon.</p>
            <label className="px-8 py-4 bg-white text-black font-black rounded-full cursor-pointer hover:scale-105 transition-transform">
              Snap starten
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </motion.div>
        )}

        {/* PROCESSING: KI-Generierung Animation */}
        {(status === 'UPLOADING' || status === 'PROCESSING') && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-2 border-white/5 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                <circle
                  cx="64" cy="64" r="62"
                  fill="transparent"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray={390}
                  strokeDashoffset={390 - (390 * progress / 100)}
                  className="transition-all duration-500"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Snapping in progress...</h3>
              <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">{progress}% abgeschlossen</p>
            </div>
          </motion.div>
        )}

        {/* SUCCESS: Das fertige Modell */}
        {status === 'SUCCESS' && modelUrl && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col"
          >
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 mb-4 bg-zinc-950">
              <EmbedViewer modelUrl={modelUrl} title="Dein 3D-Snap" />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                <CheckCircle2 size={16} /> Fertig gesnappt
              </div>
              <button
                onClick={() => setStatus('IDLE')}
                className="text-xs text-zinc-500 hover:text-white underline transition-colors"
              >
                Anderes Foto probieren
              </button>
            </div>
          </motion.div>
        )}

        {/* ERROR: Fehlerbehandlung */}
        {status === 'ERROR' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 bg-red-500/5 rounded-3xl border border-red-500/20"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Ups! Das hat nicht geklappt.</h3>
            <p className="text-red-500/60 text-sm mb-8">{error}</p>
            <button
              onClick={() => setStatus('IDLE')}
              className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
            >
              Noch mal versuchen
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
