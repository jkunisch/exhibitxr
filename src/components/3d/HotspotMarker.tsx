"use client";

import { useState, useCallback } from "react";
import { Html } from "@react-three/drei";
import type { Hotspot } from "@/types/schema";

interface HotspotMarkerProps {
    hotspot: Hotspot;
    onSelect: (id: string) => void;
    color?: string;
    fontFamily?: string;
}

/**
 * 3D Hotspot marker rendered at hotspot.position.
 * Pulsing circle with hover tooltip – uses drei <Html> for HTML-in-3D.
 */
export default function HotspotMarker({
    hotspot,
    onSelect,
    color = "#00aaff",
    fontFamily = "system-ui, sans-serif",
}: HotspotMarkerProps) {
    const [hovered, setHovered] = useState(false);

    const handleClick = useCallback(
        (e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            onSelect(hotspot.id);
        },
        [onSelect, hotspot.id],
    );

    return (
        <group position={hotspot.position}>
            {/* Invisible click target (slightly larger for UX) */}
            <mesh
                onClick={handleClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Visible glowing sphere */}
            <mesh>
                <sphereGeometry args={[0.035, 16, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive={color}
                    emissiveIntensity={hovered ? 4 : 2}
                    toneMapped={false}
                />
            </mesh>

            {/* HTML overlay: pulsing ring + hover tooltip */}
            <Html
                center
                distanceFactor={4}
                style={{
                    pointerEvents: "none",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                }}
            >
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {/* Pulsing ring */}
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `2px solid ${color}`,
                            boxShadow: `0 0 12px ${color}66`,
                            animation: "hotspot-pulse 2s ease-in-out infinite",
                        }}
                    />

                    {/* Tooltip label on hover */}
                    <div
                        style={{
                            marginTop: 6,
                            background: "rgba(0,0,0,0.8)",
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontFamily,
                            backdropFilter: "blur(8px)",
                            border: `1px solid ${color}99`,
                            opacity: hovered ? 1 : 0,
                            transform: hovered ? "translateY(0)" : "translateY(-4px)",
                            transition: "opacity 0.2s ease, transform 0.2s ease",
                        }}
                    >
                        {hotspot.label}
                    </div>
                </div>

                {/* Scoped keyframes – injected once per marker (deduped by browser) */}
                <style>{`
                    @keyframes hotspot-pulse {
                        0%, 100% { transform: scale(1); opacity: 0.8; }
                        50%      { transform: scale(1.6); opacity: 0; }
                    }
                `}</style>
            </Html>
        </group>
    );
}
