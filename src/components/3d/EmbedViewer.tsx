'use client';

import React, { useState, Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Share2, Maximize2, Box, Smartphone, ExternalLink } from 'lucide-react';
import ViewerCanvas from './ViewerCanvas';
import { useARSupport } from '@/hooks/useARSupport';

// Wir laden den schweren ModelViewer nur client-seitig und bei Bedarf
const ModelViewer = dynamic(() => import('./ModelViewer'), {
  ssr: false,
  loading: () => null
});

// model-viewer Fallback: nur auf Mobile geladen wenn kein USDZ vorhanden
// Generiert USDZ on-the-fly aus GLB für iOS AR Quick Look
const ModelViewerFallback = dynamic(() => import('./ModelViewerFallback'), {
  ssr: false,
  loading: () => null
});

interface EmbedViewerProps {
  modelUrl: string;
  usdzUrl?: string;
  posterUrl?: string;
  title?: string;
  exhibitionId?: string;
  tenantId?: string;
  autoRotate?: boolean;
  entryAnimation?: "none" | "float" | "drop" | "spin-in";
  stageType?: "none" | "pedestal-marble" | "pedestal-wood" | "backdrop-curved";
  envRotation?: number;
  onLoaded?: () => void;
}

export default function EmbedViewer({
  modelUrl,
  usdzUrl,
  posterUrl,
  title,
  exhibitionId,
  tenantId,
  autoRotate = false,
  entryAnimation = "none",
  stageType = "none",
  envRotation = 0,
  onLoaded,
}: EmbedViewerProps) {
  const [isInteracted, setIsInteracted] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const arSupport = useARSupport();

  // On mobile without pre-generated USDZ, use <model-viewer> which auto-generates USDZ
  const useMobileModelViewer = arSupport.ready
    && (arSupport.isIOS || arSupport.isAndroid)
    && !usdzUrl
    && !arSupport.isWKWebView;

  // Auto-interact if autoRotate is enabled (useful for recording)
  React.useEffect(() => {
    if (autoRotate) {
      setIsInteracted(true);
    }
  }, [autoRotate]);

  // Wir bauen ein minimales ExhibitModel Objekt für den ModelViewer
  const modelConfig = useMemo(() => ({
    id: 'embed-preview',
    label: title || 'Vorschau',
    glbUrl: modelUrl,
    scale: 1,
    position: [0, 0, 0] as [number, number, number],
    variants: [],
    hotspots: []
  }), [modelUrl, title]);

  // ── Android Scene Viewer URL ──────────────────────────────────────
  const androidARUrl = useMemo(() => {
    return `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end`;
  }, [modelUrl]);

  // ── USDZ URL with Apple Quick Look parameters ─────────────────────
  const quickLookUrl = useMemo(() => {
    if (!usdzUrl) return null;
    const embedPageUrl = exhibitionId
      ? `https://3d-snap.com/embed/${exhibitionId}`
      : window?.location?.href ?? '';
    return `${usdzUrl}#canonicalWebPageURL=${encodeURIComponent(embedPageUrl)}&allowsContentScaling=false`;
  }, [usdzUrl, exhibitionId]);

  // ── Use a 1×1 transparent pixel as the fallback <img> for Quick Look ─
  const arThumbnail = posterUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const shareId = exhibitionId ?? 'demo';
  const embedCodeHtml = `<div style="position:relative;width:100%;"><iframe src="https://3d-snap.com/embed/${shareId}" width="100%" height="500px" frameborder="0" loading="lazy" title="Interaktives 3D Modell gesnappt mit 3D-Snap" allow="xr-spatial-tracking; fullscreen; autoplay"></iframe><div style="text-align:right;font-size:10px;font-family:sans-serif;margin-top:4px;"><a href="https://3d-snap.com?utm_source=embed&utm_medium=html" target="_blank" rel="ugc noopener" style="color:#888;text-decoration:none;">Interaktives 3D-Modell von <span style="font-weight:bold;color:#555;">3D-Snap</span></a></div></div>`;

  const embedCodeMarkdown = `[![${title || '3D Modell Vorschau'}](${posterUrl || 'https://3d-snap.com/og-image.jpg'})](https://3d-snap.com/embed/${shareId})\n\n*Interaktives 3D-Modell in 15 Sekunden gesnappt mit [3D-Snap](https://3d-snap.com?utm_source=embed&utm_medium=markdown).*`;

  const copyHtml = () => {
    navigator.clipboard.writeText(embedCodeHtml);
    alert('HTML-Iframe kopiert!');
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(embedCodeMarkdown);
    alert('Markdown-Snippet kopiert!');
  };

  // ── Determine which AR button to show ─────────────────────────────
  const renderARButton = () => {
    if (!arSupport.ready) return null;

    // WKWebView (Facebook, Instagram, etc.) — show Safari hint
    if (arSupport.isWKWebView) {
      return (
        <button
          onClick={() => {
            // Try to open in Safari via a native prompt
            const currentUrl = window.location.href;
            window.open(currentUrl, '_blank');
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
          title="AR nur in Safari verfügbar"
        >
          <ExternalLink size={14} />
          <span>In Safari öffnen</span>
        </button>
      );
    }

    // iOS + AR Quick Look supported + USDZ available
    if (arSupport.supportsQuickLook && quickLookUrl) {
      return (
        // APPLE REQUIREMENT: <a rel="ar"> with <img> as FIRST child element.
        // - No target="_blank" (shows ugly intermediate thumbnail)
        // - Must be triggered by user tap (no programmatic .click())
        // - First child MUST be <img> — Apple ignores the link otherwise
        <a
          rel="ar"
          href={quickLookUrl}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00aaff]/10 border border-[#00aaff]/20 text-[#00aaff] hover:bg-[#00aaff]/20 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
        >
          {/* CRITICAL: First child MUST be <img> for AR Quick Look */}
          <img
            src={arThumbnail}
            alt="In AR ansehen"
            width={14}
            height={14}
            className="w-3.5 h-3.5 object-cover rounded-sm"
          />
          <span>📱 AR</span>
        </a>
      );
    }

    // iOS but no USDZ — show disabled state
    if (arSupport.isIOS && !usdzUrl) {
      return (
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/30 text-zinc-600 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
          title="AR Vorschau wird vorbereitet..."
        >
          <Box size={14} />
          <span>AR</span>
        </button>
      );
    }

    // Android — Scene Viewer (works directly with GLB, no USDZ needed!)
    if (arSupport.supportsSceneViewer) {
      return (
        <a
          href={androidARUrl}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00aaff]/10 border border-[#00aaff]/20 text-[#00aaff] hover:bg-[#00aaff]/20 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
        >
          <Smartphone size={14} />
          <span>📱 AR</span>
        </a>
      );
    }

    // Desktop — subtle AR button (non-functional, promotional)
    return (
      <button
        onClick={() => {
          alert('AR-Vorschau ist auf iOS Safari und Android Chrome verfügbar. Öffne diesen Link auf deinem Smartphone!');
        }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
        title="AR ansehen (nur auf Mobilgeräten)"
      >
        <Box size={14} />
        <span>AR</span>
      </button>
    );
  };

  return (
    <div className="relative group w-full h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex flex-col">
      {/* 3D Canvas / Poster Area */}
      <div className="relative flex-1 cursor-pointer" onClick={() => setIsInteracted(true)}>
        {!isInteracted ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
            {posterUrl ? (
              <img src={posterUrl} alt={title || '3D Modell Vorschau'} className="absolute inset-0 w-full h-full object-contain blur-sm opacity-50" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
            )}
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-white border-b-[10px] border-b-transparent ml-1" />
              </div>
              <p className="mt-4 text-xs font-medium tracking-widest text-white/60 uppercase">Klicken zum Interagieren</p>
            </div>
          </div>
        ) : useMobileModelViewer ? (
          // Mobile fallback: <model-viewer> auto-generates USDZ from GLB
          <div className="absolute inset-0 z-10 bg-zinc-900">
            <ModelViewerFallback
              glbUrl={modelUrl}
              usdzUrl={usdzUrl}
              posterUrl={posterUrl}
              autoRotate={autoRotate}
            />
          </div>
        ) : (
          <div className="absolute inset-0 z-10 bg-zinc-900">
            <ViewerCanvas
              bgColor="transparent"
              autoRotate={autoRotate}
              stageType={stageType}
              envRotation={envRotation}
            >
              <Suspense fallback={null}>
                <ModelViewer config={modelConfig} entryAnimation={entryAnimation} onLoaded={onLoaded} />
              </Suspense>
            </ViewerCanvas>
          </div>
        )}
      </div>

      {/* Footer Branding & Controls */}
      <div className="h-10 px-3 bg-black/80 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a
            href={`https://3d-snap.com?utm_source=embed&utm_medium=viewer&utm_campaign=${tenantId || 'demo'}`}
            target="_blank"
            rel="ugc noopener"
            className="group/link flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-2 py-1.5 transition-all duration-300 hover:bg-white/10 hover:border-white/20 shadow-lg"
            title="3D-Snap by ExhibitXR - Foto zu 3D Technologie"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00aaff] text-[10px] font-black text-white shadow-[0_0_10px_rgba(0,170,255,0.5)] group-hover/link:animate-pulse">
              ⚡
            </div>
            <div className="flex flex-col justify-center overflow-hidden transition-all duration-300 max-w-[55px] group-hover/link:max-w-[120px]">
              <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap leading-tight">
                3D-SNAP
              </span>
              <span className="text-[8px] font-bold text-[#00aaff] whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/link:opacity-100">
                In 15 Sek. gesnappt.
              </span>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-3">
          {renderARButton()}
          <button
            onClick={() => setShowShare(!showShare)}
            className="text-zinc-500 hover:text-white transition-colors"
            title="Teilen & Einbetten"
          >
            <Share2 size={14} />
          </button>
          <button className="text-zinc-500 hover:text-white transition-colors" title="Vollbild">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Share Overlay */}
      {showShare && (
        <div className="absolute inset-0 z-30 bg-black/95 p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-bold mb-2">Dieses Modell teilen</h3>
          <p className="text-sm text-zinc-400 mb-6">Möchten Sie dieses 3D-Erlebnis auch auf Ihrer Website nutzen?</p>

          <div className="w-full space-y-3">
            <button
              onClick={copyHtml}
              className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              HTML Iframe kopieren
            </button>
            <button
              onClick={copyMarkdown}
              className="w-full py-3 bg-[#00aaff] text-white font-bold rounded-lg hover:bg-[#0090dd] transition-colors"
            >
              Markdown Link kopieren
            </button>
            <button
              onClick={() => setShowShare(false)}
              className="w-full py-3 bg-zinc-900 text-white font-bold rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              Schließen
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800 w-full text-xs text-zinc-500">
            Technologie von <a href="https://3d-snap.com" className="text-white underline">3d-snap.com</a>
          </div>
        </div>
      )}
    </div>
  );
}
