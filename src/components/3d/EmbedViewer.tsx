"use client";

import { useState, useCallback } from "react";
import ViewerCanvas from "@/components/3d/ViewerCanvas";
import ModelViewer from "@/components/3d/ModelViewer";
import ChatWidget from "@/components/ui/ChatWidget";
import type { ExhibitConfig } from "@/types/schema";
import { DEFAULT_AMBIENT_INTENSITY } from "@/lib/lighting";
import { useAnalytics } from "@/hooks/useAnalytics";
import { isWallProduct } from "@/lib/viewerOrbit";

interface EmbedViewerProps {
    config: ExhibitConfig;
    ambientIntensity?: number;
    enableChat?: boolean;
}

/**
 * Embeddable 3D viewer — full viewport, no dashboard chrome.
 * Renders the model with variant switching and hotspot interaction.
 */
export default function EmbedViewer({
    config,
    ambientIntensity = DEFAULT_AMBIENT_INTENSITY,
    enableChat,
}: EmbedViewerProps) {
    const restrictOrbitToHalfTurn = isWallProduct(config);
    const { trackHotspotClick, trackVariantChange, trackChatMessage } = useAnalytics(
        config.id,
        config.tenantId
    );

    const [activeVariant, setActiveVariant] = useState<string | undefined>(
        config.model.variants[0]?.id
    );
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

    const handleHotspotClick = useCallback(
        (hotspotId: string) => {
            setActiveHotspot((prev) => {
                const isNew = prev !== hotspotId;
                if (isNew) trackHotspotClick(hotspotId);
                return isNew ? hotspotId : null;
            });
        },
        [trackHotspotClick]
    );

    const handleVariantChange = useCallback(
        (variantId: string) => {
            setActiveVariant(variantId);
            trackVariantChange(variantId);
        },
        [trackVariantChange]
    );

    const hotspotInfo = activeHotspot
        ? config.model.hotspots.find((h) => h.id === activeHotspot)
        : null;

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            {/* 3D Canvas — receives ALL mouse events */}
            <ViewerCanvas
                environment={config.environment}
                contactShadows={config.contactShadows}
                bgColor={config.bgColor}
                ambientIntensity={ambientIntensity}
                cameraPosition={config.cameraPosition}
                restrictOrbitToHalfTurn={restrictOrbitToHalfTurn}
            >
                <ModelViewer
                    config={config.model}
                    activeVariantId={activeVariant}
                    onHotspotClick={handleHotspotClick}
                />
            </ViewerCanvas>

            {/* ── HTML Overlay Layer ─────────────────────────────────── */}
            {/* ENTIRE overlay is pointer-events-none so canvas gets clicks */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 10,
                }}
            >
                {/* Title (top-left) */}
                <div
                    style={{
                        position: "absolute",
                        top: 20,
                        left: 24,
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#fff",
                        fontFamily: "system-ui, sans-serif",
                        opacity: 0.9,
                        textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    }}
                >
                    {config.title}
                </div>

                {/* Variant Switcher (bottom-left) — buttons opt-in to pointer events */}
                {config.model.variants.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 24,
                            left: 24,
                            display: "flex",
                            gap: 8,
                            pointerEvents: "auto",
                        }}
                    >
                        {config.model.variants.map((variant) => (
                            <button
                                key={variant.id}
                                onClick={() => handleVariantChange(variant.id)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: 8,
                                    border:
                                        activeVariant === variant.id
                                            ? "2px solid #00aaff"
                                            : "1px solid rgba(255,255,255,0.2)",
                                    background:
                                        activeVariant === variant.id
                                            ? "rgba(0, 170, 255, 0.15)"
                                            : "rgba(0,0,0,0.6)",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontFamily: "system-ui, sans-serif",
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
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            fontFamily: "system-ui, sans-serif",
                            pointerEvents: "auto",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 6px",
                                fontSize: 15,
                                fontWeight: 600,
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
            </div>

            {/* AI Chat Widget */}
            {enableChat && (
                <ChatWidget
                    context={JSON.stringify(config)}
                    onMessageSent={trackChatMessage}
                />
            )}
        </div>
    );
}

