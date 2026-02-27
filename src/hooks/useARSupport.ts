'use client';

import { useState, useEffect } from 'react';

export interface ARSupport {
  /** iOS Safari with native AR Quick Look (not WKWebView) */
  supportsQuickLook: boolean;
  /** Android with ARCore Scene Viewer */
  supportsSceneViewer: boolean;
  /** In-app browser (Facebook, Instagram, LinkedIn) — Quick Look blocked */
  isWKWebView: boolean;
  /** Any iOS device */
  isIOS: boolean;
  /** Any Android device */
  isAndroid: boolean;
  /** Detection has completed */
  ready: boolean;
}

/**
 * Detects AR capabilities of the current browser.
 *
 * Key gotchas handled:
 * - WKWebView (Facebook/Instagram in-app browser) blocks AR Quick Look
 * - `a.relList.supports('ar')` is the Apple-recommended feature detection
 * - Scene Viewer availability is inferred from Android UA (no direct detection API)
 */
export function useARSupport(): ARSupport {
  const [support, setSupport] = useState<ARSupport>({
    supportsQuickLook: false,
    supportsSceneViewer: false,
    isWKWebView: false,
    isIOS: false,
    isAndroid: false,
    ready: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent;

    // ── Platform detection ────────────────────────────────────────────
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroid = /android/i.test(ua);

    // ── WKWebView detection (in-app browsers) ─────────────────────────
    // Facebook, Instagram, LinkedIn, TikTok all use WKWebView on iOS.
    // These block AR Quick Look entirely — the link just shows garbage.
    const isWKWebView = isIOS && (
      /FBAN|FBAV/i.test(ua) ||       // Facebook
      /Instagram/i.test(ua) ||         // Instagram
      /LinkedIn/i.test(ua) ||          // LinkedIn
      /BytedanceWebview/i.test(ua) ||  // TikTok
      // Generic WKWebView detection: Safari is NOT in the UA string
      // but the device is iOS — this catches most in-app browsers
      (!/Safari/i.test(ua) && /AppleWebKit/i.test(ua))
    );

    // ── AR Quick Look detection (Apple's recommended method) ──────────
    let supportsQuickLook = false;
    if (isIOS && !isWKWebView) {
      try {
        const anchor = document.createElement('a');
        supportsQuickLook = anchor.relList?.supports?.('ar') ?? false;
      } catch {
        supportsQuickLook = false;
      }
    }

    // ── Scene Viewer detection (Android) ──────────────────────────────
    // No direct API to detect ARCore — we infer from Android UA.
    // Scene Viewer gracefully falls back if ARCore isn't installed.
    const supportsSceneViewer = isAndroid;

    setSupport({
      supportsQuickLook,
      supportsSceneViewer,
      isWKWebView,
      isIOS,
      isAndroid,
      ready: true,
    });
  }, []);

  return support;
}
