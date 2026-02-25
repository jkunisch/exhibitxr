'use client';

import React, { useState, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { Upload, Link2, CheckCircle2, AlertTriangle, ArrowRight, Smartphone, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ARPreviewGenerator() {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setError("Bitte laden Sie eine .glb oder .gltf Datei hoch.");
      return;
    }
    
    // Create a local blob URL for the uploaded file
    const url = URL.createObjectURL(file);
    setModelUrl(url);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    try {
      new URL(inputUrl);
      setModelUrl(inputUrl);
      setError(null);
    } catch {
      setError("Bitte geben Sie eine gültige URL ein (http:// oder https://).");
    }
  };

  // Generate Google Scene Viewer Intent Link for Android
  const generateAndroidARLink = (url: string) => {
    // Scene Viewer requires the URL to be absolute.
    // If it's a blob: URL, Scene Viewer cannot access it directly from another app (the scanner).
    // We will construct the intent anyway to demonstrate the concept, but in production, 
    // files need to be uploaded to a public server first.
    
    // To make this tool truly useful as a "Drop-Tool" without server costs, 
    // we generate a web-based fallback viewer URL that *then* triggers the AR intent,
    // or we just show the concept. For this tool, we assume the user provides a public URL
    // or we are just showing the QR code of the raw URL if it's a blob (which won't work on mobile natively).
    
    // Best effort for the hook: If it's a blob, we encode it. It won't scan on mobile (blob is local).
    // This creates the perfect upsell: "Local files don't work in AR. Let 3D-Snap host and convert them."
    
    if (url.startsWith('blob:')) {
      return url; // We will use this to trigger the upsell explicitly
    }

    const encodedUrl = encodeURIComponent(url);
    return `intent://arvr.google.com/scene-viewer/1.0?file=${encodedUrl}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`;
  };

  const arLink = modelUrl ? generateAndroidARLink(modelUrl) : '';
  const isLocalBlob = modelUrl.startsWith('blob:');

  return (
    <div className="min-h-screen bg-[#010102] text-white pt-32 pb-24 selection:bg-[#00aaff]/30">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#00aaff] mb-6">
            <Smartphone size={14} />
            Engineering as Marketing
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
            AR Preview Generator
          </h1>
          <p className="text-xl text-zinc-400 font-medium max-w-2xl mx-auto">
            Teste dein 3D-Modell in Augmented Reality. Zieh dein <span className="text-white font-bold">.glb</span> rein und scanne den QR-Code mit deinem Smartphone.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Upload / Input */}
          <div className="space-y-8">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-dashed transition-all duration-300 ${
                isDragging 
                  ? 'border-[#00aaff] bg-[#00aaff]/5 scale-[1.02]' 
                  : 'border-white/10 bg-zinc-900/20 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center mb-6 shadow-xl">
                <Upload size={32} className={isDragging ? 'text-[#00aaff]' : 'text-zinc-500'} />
              </div>
              <h3 className="text-2xl font-black mb-2">GLB Datei hierher ziehen</h3>
              <p className="text-sm text-zinc-500 font-medium">oder klicken zum Auswählen</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
              <div className="h-px flex-1 bg-white/10"></div>
              ODER ÖFFENTLICHE URL
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            {/* URL Input */}
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://dein-server.de/modell.glb"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00aaff] transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-zinc-200 transition-colors"
              >
                Laden
              </button>
            </form>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: QR Code & The Hook */}
          <div className="relative">
            {modelUrl ? (
              <div className="bg-zinc-900/40 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl">
                
                {/* The QR Code */}
                <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(0,170,255,0.15)] mb-8 transition-all duration-500">
                  <QRCode 
                    value={arLink} 
                    size={200}
                    level="Q"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                <h3 className="text-2xl font-black mb-4">Dein AR-Code ist bereit.</h3>
                
                {isLocalBlob ? (
                  <div className="space-y-6">
                     <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                       Du testest eine lokale Datei. <span className="text-yellow-500 font-bold">Smartphones können lokale Browser-Dateien nicht in AR öffnen</span>, da sie auf einem Server gehostet sein müssen. Zudem benötigt iOS zwingend das <span className="text-white font-bold">USDZ</span>-Format.
                     </p>
                     
                     {/* The Trojan Upsell */}
                     <div className="p-6 bg-[#00aaff]/10 border border-[#00aaff]/20 rounded-2xl text-left relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                          <Sparkles size={64} className="text-[#00aaff]" />
                       </div>
                       <h4 className="text-[#00aaff] font-black text-lg mb-2 flex items-center gap-2">
                         Die Lösung: 3D-Snap
                       </h4>
                       <p className="text-sm text-zinc-300 font-medium mb-6">
                         Spar dir das Hosting und das manuelle Konvertieren für iOS. Mit 3D-Snap lädst du ein Foto hoch und wir generieren, hosten und konvertieren das Modell vollautomatisch für alle AR-Geräte.
                       </p>
                       <Link 
                          href="/" 
                          className="inline-flex items-center gap-2 px-6 py-3 bg-[#00aaff] hover:bg-[#0090dd] text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
                       >
                         Jetzt Foto Snappen <ArrowRight size={14} />
                       </Link>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                     <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                       Scanne diesen Code mit deinem Android-Gerät, um das Modell im Raum zu platzieren.
                     </p>
                     
                     {/* The Trojan Upsell */}
                     <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-colors group">
                       <h4 className="text-white font-black text-lg mb-2">
                         Mache AR zum Standard.
                       </h4>
                       <p className="text-sm text-zinc-400 font-medium mb-6">
                         Du hast noch hunderte Produkte ohne 3D-Modell? 3D-Snap generiert dir aus simplen Produktfotos in Sekunden commerce-ready 3D & AR Assets.
                       </p>
                       <Link 
                          href="/" 
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
                       >
                         3D-Snap Workflow ansehen <ArrowRight size={14} />
                       </Link>
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center min-h-[500px]">
                 <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-6">
                    <Smartphone size={32} className="text-zinc-600" />
                 </div>
                 <h3 className="text-xl font-bold text-zinc-500 mb-2">Warte auf Datei...</h3>
                 <p className="text-sm text-zinc-600 max-w-xs">
                   Lade ein Modell hoch oder gib eine URL ein, um den AR-QR-Code zu generieren.
                 </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
