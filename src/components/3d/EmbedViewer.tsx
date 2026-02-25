"use client";

import { useState, useCallback } from "react";
import ViewerCanvas from "@/components/3d/ViewerCanvas";
import ModelViewer from "@/components/3d/ModelViewer";
import {
    buildEmbedFontFamily,
    buildGoogleFontImportRule,
    resolveEmbedPrimaryColor,
} from "@/lib/branding";
import type { EmbedBranding } from "@/types/branding";
import type { ExhibitConfig } from "@/types/schema";

interface EmbedViewerProps {
    config: ExhibitConfig;
    branding?: EmbedBranding;
}

function hexToRgba(color: string, alpha: number): string {
    const normalized = color.replace("#", "").trim();
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    if (normalized.length === 3) {
        const r = Number.parseInt(normalized[0] + normalized[0], 16);
        const g = Number.parseInt(normalized[1] + normalized[1], 16);
        const b = Number.parseInt(normalized[2] + normalized[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
    }

    if (normalized.length === 6) {
        const r = Number.parseInt(normalized.slice(0, 2), 16);
        const g = Number.parseInt(normalized.slice(2, 4), 16);
        const b = Number.parseInt(normalized.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
    }

    return `rgba(0, 170, 255, ${clampedAlpha})`;
}

/**
 * Embeddable 3D viewer — full viewport, no dashboard chrome.
 * Renders the model with variant switching and hotspot interaction.
 */
export default function EmbedViewer({ config, branding }: EmbedViewerProps) {
    const [activeVariant, setActiveVariant] = useState<string | undefined>(
        config.model.variants[0]?.id
    );
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
    const primaryColor = resolveEmbedPrimaryColor(branding);
    const fontFamily = buildEmbedFontFamily(branding?.fontFamily);
    const googleFontImportRule = buildGoogleFontImportRule(branding?.fontFamily);
    const customCss = branding?.customCss?.trim() || null;
    const showWatermark = branding?.hideWatermark !== true;

    const handleHotspotClick = useCallback((hotspotId: string) => {
        setActiveHotspot((prev) => (prev === hotspotId ? null : hotspotId));
    }, []);

    const hotspotInfo = activeHotspot
        ? config.model.hotspots.find((h) => h.id === activeHotspot)
        : null;

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                fontFamily,
            }}
        >
            {googleFontImportRule ? <style>{googleFontImportRule}</style> : null}
            {customCss ? <style>{customCss}</style> : null}
            <style>{`
                [data-exhibitxr-watermark] {
                    position: fixed !important;
                    left: 12px !important;
                    bottom: 10px !important;
                    z-index: 2147483647 !important;
                    pointer-events: auto !important;
                }
                [data-exhibitxr-watermark] a {
                    pointer-events: auto !important;
                    text-decoration: none !important;
                }
            `}</style>

            <ViewerCanvas
                environment={config.environment}
                contactShadows={config.contactShadows}
                bgColor={config.bgColor}
                cameraPosition={config.cameraPosition}
            >
                <ModelViewer
                    config={config.model}
                    activeVariantId={activeVariant}
                    onHotspotClick={handleHotspotClick}
                    hotspotColor={primaryColor}
                    hotspotFontFamily={fontFamily}
                />
            </ViewerCanvas>

            {/* Variant Switcher (bottom-left) */}
            {config.model.variants.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 24,
                        left: 24,
                        display: "flex",
                        gap: 8,
                    }}
                >
                    {config.model.variants.map((variant) => (
                        <button
                            key={variant.id}
                            onClick={() => setActiveVariant(variant.id)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: 8,
                                border:
                                    activeVariant === variant.id
                                        ? `2px solid ${primaryColor}`
                                        : "1px solid rgba(255,255,255,0.2)",
                                background:
                                    activeVariant === variant.id
                                        ? hexToRgba(primaryColor, 0.16)
                                        : "rgba(0,0,0,0.6)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 13,
                                fontFamily: "inherit",
                                backdropFilter: "blur(12px)",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {variant.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Hotspot Info Panel (bottom-right) */}
            {hotspotInfo && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 24,
                        right: 24,
                        maxWidth: 280,
                        padding: "16px 20px",
                        borderRadius: 12,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(16px)",
                        border: `1px solid ${hexToRgba(primaryColor, 0.45)}`,
                        borderLeft: `3px solid ${primaryColor}`,
                        color: "#fff",
                        boxShadow: `0 0 28px ${hexToRgba(primaryColor, 0.2)}`,
                        fontFamily: "inherit",
                    }}
                >
                    <h3
                        style={{
                            margin: "0 0 6px",
                            fontSize: 15,
                            fontWeight: 600,
                            color: primaryColor,
                        }}
                    >
                        {hotspotInfo.label}
                    </h3>
                    {hotspotInfo.description && (
                        <p style={{ margin: 0, fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>
                            {hotspotInfo.description}
                        </p>
                    )}
                </div>
            )}

            {/* Brand Header */}
            <div
                style={{
                    position: "absolute",
                    top: 16,
                    left: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    pointerEvents: "none",
                    zIndex: 20,
                }}
            >
                {branding?.logoUrl ? (
                    <img
                        src={branding.logoUrl}
                        alt="Brand logo"
                        style={{
                            maxWidth: 120,
                            maxHeight: 40,
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            opacity: 0.95,
                        }}
                    />
                ) : null}
                <div
                    style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#fff",
                        opacity: 0.9,
                        textShadow: "0 1px 6px rgba(0,0,0,0.35)",
                    }}
                >
                    {config.title}
                </div>
            </div>

            {showWatermark ? (
                <div
                    data-exhibitxr-watermark
                    style={{
                        fontSize: 10,
                        opacity: 0.4,
                        lineHeight: 1.25,
                        color: "#ffffff",
                        zIndex: 2147483647,
                        pointerEvents: "auto",
                        fontFamily: "system-ui, sans-serif",
                    }}
                >
                    <a
                        href="https://exhibitxr.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "inherit" }}
                    >
                        Powered by ExhibitXR
                    </a>
                </div>
            ) : null}
        </div>
    );
}
