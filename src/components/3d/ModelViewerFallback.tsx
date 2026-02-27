'use client';

/**
 * ModelViewerFallback — Google's <model-viewer> web component.
 *
 * Used as a fallback on mobile when no pre-generated USDZ exists.
 * <model-viewer> can auto-generate USDZ from GLB at runtime for iOS AR Quick Look.
 *
 * Only loaded on mobile via dynamic import — adds ~300KB to the bundle.
 * Desktop viewers continue using React Three Fiber for full interactivity.
 */

import React, { useEffect, useRef } from 'react';

// Type declarations are in src/types/model-viewer.d.ts

interface ModelViewerFallbackProps {
  /** URL to the GLB model file */
  glbUrl: string;
  /** Optional pre-generated USDZ URL (if available, skips runtime conversion) */
  usdzUrl?: string;
  /** Poster image shown while model loads */
  posterUrl?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Callback when AR session starts */
  onARStarted?: () => void;
  /** Callback when AR session ends */
  onAREnded?: () => void;
}

export default function ModelViewerFallback({
  glbUrl,
  usdzUrl,
  posterUrl,
  alt = '3D Modell',
  autoRotate = false,
  onARStarted,
  onAREnded,
}: ModelViewerFallbackProps) {
  const ref = useRef<HTMLElement>(null);
  const importDone = useRef(false);

  // Dynamically import model-viewer (browser-only, no SSR)
  useEffect(() => {
    if (importDone.current) return;
    importDone.current = true;
    import('@google/model-viewer').catch((err) => {
      console.warn('[ModelViewerFallback] Failed to load @google/model-viewer:', err);
    });
  }, []);

  // AR status event listeners for analytics
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleARStatus = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.status === 'session-started') {
        onARStarted?.();
      }
      if (detail?.status === 'failed' || detail?.status === 'not-presenting') {
        onAREnded?.();
      }
    };

    el.addEventListener('ar-status', handleARStatus);
    return () => el.removeEventListener('ar-status', handleARStatus);
  }, [onARStarted, onAREnded]);

  return (
    <model-viewer
      ref={ref as React.RefObject<HTMLElement>}
      src={glbUrl}
      ios-src={usdzUrl}
      poster={posterUrl}
      alt={alt}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="fixed"
      camera-controls
      auto-rotate={autoRotate ? '' : undefined}
      shadow-intensity="1"
      exposure="1"
      loading="lazy"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
      } as React.CSSProperties}
    >
      <button
        slot="ar-button"
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          padding: '8px 16px',
          backgroundColor: 'rgba(0, 170, 255, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          fontSize: '12px',
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0, 170, 255, 0.3)',
        }}
      >
        📱 In AR ansehen
      </button>
    </model-viewer>
  );
}
