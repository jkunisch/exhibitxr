'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, CheckCircle2, AlertCircle, Camera, Zap, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EmbedViewer from '@/components/3d/EmbedViewer';

type SnapProvider = 'basic' | 'premium';

export default function HomeSnapModule() {
  const router = useRouter();
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<SnapProvider>('premium');
  const providerRef = useRef<SnapProvider>('premium');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const resetState = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus('IDLE');
    setProgress(0);
    setModelUrl(null);
    setError(null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Das Bild ist zu groß (max. 10MB).");
      setStatus('ERROR');
      return;
    }

    // CRITICAL: Defer state change so React doesn't unmount the <input>
    // while the browser's onChange event is still active.
    // AnimatePresence mode="wait" removes the IDLE block (including
    // the <input>) the moment status changes — if that happens mid-event,
    // React crashes and the page does a full reload.
    setTimeout(() => {
      startUpload(file);
    }, 0);
  }, []);

  const startUpload = useCallback(async (file: File) => {
    setStatus('UPLOADING');
    setError(null);

    try {
      // Capture provider at upload time so polling uses the same one
      const activeProvider = providerRef.current;

      const formData = new FormData();
      formData.append('image', file);
      formData.append('provider', activeProvider);

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

      // Polling Logic with error tracking
      let consecutiveErrors = 0;
      const MAX_POLL_ERRORS = 5;

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/snap-preview/${taskId}?provider=${activeProvider}`);
          const data = await pollRes.json();

          if (!pollRes.ok) {
            consecutiveErrors++;
            console.error(`[snap-preview] Poll error ${consecutiveErrors}/${MAX_POLL_ERRORS}:`, data.error);
            if (consecutiveErrors >= MAX_POLL_ERRORS) {
              if (pollRef.current) clearInterval(pollRef.current);
              setError(data.error || "Generierung fehlgeschlagen. Bitte erneut versuchen.");
              setStatus('ERROR');
            }
            return;
          }

          consecutiveErrors = 0;
          setProgress((prev) => Math.max(prev, data.progress || 0));

          if (data.status === 'SUCCEEDED') {
            if (pollRef.current) clearInterval(pollRef.current);
            setModelUrl(data.glbUrl);
            setStatus('SUCCESS');
          } else if (data.status === 'FAILED') {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(data.error || "Die KI konnte kein Modell erstellen. Bitte anderes Foto probieren.");
            setStatus('ERROR');
          }
        } catch (err) {
          consecutiveErrors++;
          console.error(`[snap-preview] Poll exception ${consecutiveErrors}/${MAX_POLL_ERRORS}:`, err);
          if (consecutiveErrors >= MAX_POLL_ERRORS) {
            if (pollRef.current) clearInterval(pollRef.current);
            setError("Verbindungsfehler bei der 3D-Generierung. Bitte erneut versuchen.");
            setStatus('ERROR');
          }
        }
      }, 3000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler beim Starten des Snaps.";
      setError(msg);
      setStatus('ERROR');
    }
  }, []);

  return (
    <div className="relative z-20 flex h-full min-h-[500px] w-full flex-col items-center justify-center p-6">
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
            {/* Provider Toggle */}
            <div className="mb-6 inline-flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => { setProvider('basic'); providerRef.current = 'basic'; }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${provider === 'basic'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                <Zap size={12} /> Basic
              </button>
              <button
                onClick={() => { setProvider('premium'); providerRef.current = 'premium'; }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${provider === 'premium'
                  ? 'bg-[#00aaff]/20 text-[#00aaff] shadow-sm border border-[#00aaff]/30'
                  : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                <Sparkles size={12} /> Premium
              </button>
            </div>
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
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#00aaff] shadow-[0_0_20px_rgba(0,170,255,0.15)] backdrop-blur-md">
              <Zap size={14} className="animate-pulse" />
              Snap it
            </div>
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

        {/* SUCCESS: Das fertige Modell + Studio CTA */}
        {status === 'SUCCESS' && modelUrl && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl flex flex-col"
          >
            <div className="w-full rounded-2xl overflow-hidden border border-white/10 mb-4 bg-zinc-950" style={{ height: '400px' }}>
              <EmbedViewer modelUrl={modelUrl} title="Dein 3D-Snap" />
            </div>

            <button
              onClick={() => {
                localStorage.setItem('pending_snap_url', modelUrl);
                router.push('/dashboard');
              }}
              className="w-full py-4 bg-[#00aaff] hover:bg-[#0090dd] text-white text-center font-black text-lg rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-[#00aaff]/30 mb-3"
            >
              Im Studio öffnen →
            </button>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                <CheckCircle2 size={16} /> Fertig gesnappt
              </div>
              <button
                onClick={resetState}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-full border border-white/10 transition-all"
              >
                ✨ Neues Foto snappen
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
              onClick={resetState}
              className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
            >
              Noch mal versuchen
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Demo-Preview: Beispiel-Ergebnis */}
      {status === 'IDLE' && (
        <div className="w-full max-w-4xl mx-auto mt-12">
          <p className="text-center text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">
            So sieht dein Ergebnis aus ↓
          </p>
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950" style={{ height: '350px' }}>
            <EmbedViewer
              modelUrl="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb"
              title="Demo 3D-Snap"
            />
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-2">
            Klicken & Drehen zum Interagieren — Demo-Modell
          </p>
        </div>
      )}
    </div>
  );
}
