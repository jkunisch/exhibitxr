"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import type { ExhibitModel as ExhibitModelType } from "@/types/schema";

interface ModelViewerProps {
    config: ExhibitModelType;
    /** ID of the currently active variant (optional). */
    activeVariantId?: string;
    /** Callback when a hotspot is clicked. */
    onHotspotClick?: (hotspotId: string) => void;
    /** Accent color for hotspot glow and labels. */
    hotspotColor?: string;
    /** Font family for hotspot labels. */
    hotspotFontFamily?: string;
}

/**
 * Loads and displays a GLB model with variant material switching and hotspot markers.
 */
export default function ModelViewer({
    config,
    activeVariantId,
    onHotspotClick,
    hotspotColor = "#00aaff",
    hotspotFontFamily = "system-ui, sans-serif",
}: ModelViewerProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF(config.glbUrl);

    // Clone the scene so we can apply material changes without polluting the cache
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    // Apply active variant materials
    useMemo(() => {
        if (!activeVariantId) return;

        const variant = config.variants.find((v) => v.id === activeVariantId);
        if (!variant) return;

        clonedScene.traverse((child) => {
            if (
                child instanceof THREE.Mesh &&
                variant.meshTargets.includes(child.name)
            ) {
                const mat = (child.material as THREE.MeshStandardMaterial).clone();
                if (variant.color) mat.color.set(variant.color);
                if (variant.roughness !== undefined) mat.roughness = variant.roughness;
                if (variant.metalness !== undefined) mat.metalness = variant.metalness;
                child.material = mat;
            }
        });
    }, [clonedScene, activeVariantId, config.variants]);

    // Gentle idle rotation
    useFrame((_state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.08;
        }
    });

    return (
        <group
            ref={groupRef}
            position={config.position}
            scale={config.scale}
        >
            <primitive object={clonedScene} />

            {/* Hotspot markers */}
            {config.hotspots.map((hotspot) => (
                <group key={hotspot.id} position={hotspot.position}>
                    {/* Glowing sphere marker */}
                    <mesh
                        onClick={(e) => {
                            e.stopPropagation();
                            onHotspotClick?.(hotspot.id);
                        }}
                    >
                        <sphereGeometry args={[0.04, 16, 16]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive={hotspotColor}
                            emissiveIntensity={2}
                            toneMapped={false}
                        />
                    </mesh>

                    {/* Hotspot label (HTML overlay) */}
                    <Html
                        distanceFactor={4}
                        style={{
                            pointerEvents: "none",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <div
                            style={{
                                background: "rgba(0,0,0,0.75)",
                                color: "#fff",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: `0 0 0 1px ${hotspotColor}66`,
                                fontFamily: hotspotFontFamily,
                            }}
                        >
                            {hotspot.label}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}
