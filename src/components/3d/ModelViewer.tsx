"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { useGLTF, PivotControls } from "@react-three/drei";
import * as THREE from "three";
import type { ExhibitModel as ExhibitModelType } from "@/types/schema";
import HotspotMarker from "./HotspotMarker";

/** Google-hosted Draco decoder for up to 80% smaller GLB payloads. */
const DRACO_DECODER_PATH =
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

/** Prefix for meshes that should be treated as configurable variants. */
const VAR_PREFIX = "VAR__";

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
    /** Enable editor interactions (selection highlight, PivotControls). */
    isEditor?: boolean;
    /** Whether this model is currently selected in editor mode. */
    isSelected?: boolean;
    /** Called when user clicks this model in editor mode. */
    onSelect?: () => void;
    /** Called when PivotControls drag ends with the new world position. */
    onTransformEnd?: (position: [number, number, number]) => void;
}

/**
 * Enterprise-grade GLB model loader.
 *
 * Features:
 * - Draco-compressed loading via gstatic decoder
 * - Auto-enables castShadow/receiveShadow on all meshes
 * - Boosted envMapIntensity for brilliant PBR reflections
 * - Variant material switching (color, roughness, metalness)
 * - Hotspot markers rendered in 3D space
 * - PivotControls in editor mode for visual drag editing
 * - Gentle idle rotation in viewer mode
 */
export default function ModelViewer({
    config,
    activeVariantId,
    onHotspotClick,
    hotspotColor = "#00aaff",
    hotspotFontFamily = "system-ui, sans-serif",
    isEditor = false,
    isSelected = false,
    onSelect,
    onTransformEnd,
}: ModelViewerProps) {
    const groupRef = useRef<THREE.Group>(null);

    // If no GLB URL, render an empty placeholder instead of crashing
    if (!config.glbUrl) {
        return (
            <group>
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshStandardMaterial color="#334155" wireframe />
                </mesh>
            </group>
        );
    }

    return <ModelViewerInner
        config={config}
        activeVariantId={activeVariantId}
        onHotspotClick={onHotspotClick}
        hotspotColor={hotspotColor}
        hotspotFontFamily={hotspotFontFamily}
        isEditor={isEditor}
        isSelected={isSelected}
        onSelect={onSelect}
        onTransformEnd={onTransformEnd}
    />;
}

function ModelViewerInner({
    config,
    activeVariantId,
    onHotspotClick,
    hotspotColor = "#00aaff",
    hotspotFontFamily = "system-ui, sans-serif",
    isEditor = false,
    isSelected = false,
    onSelect,
    onTransformEnd,
}: ModelViewerProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF(config.glbUrl, DRACO_DECODER_PATH);

    // Clone scene to avoid polluting the GLTF cache
    // Enable shadows + boost PBR reflection quality on every mesh
    const clonedScene = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                // Shadows: every mesh casts and receives
                node.castShadow = true;
                node.receiveShadow = true;

                // Boost PBR reflections from the HDRI environment
                if (node.material) {
                    const mat = node.material as THREE.MeshStandardMaterial;
                    if ("envMapIntensity" in mat) {
                        mat.envMapIntensity = 1.2;
                    }
                    mat.needsUpdate = true;
                }
            }
        });
        return clone;
    }, [scene]);

    // Discover meshes with VAR__ prefix for automatic variant targeting
    const configurableMeshNames = useMemo(() => {
        const names: string[] = [];
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name.startsWith(VAR_PREFIX)) {
                names.push(child.name);
            }
        });
        return names;
    }, [clonedScene]);

    useEffect(() => {
        if (configurableMeshNames.length > 0) {
            console.debug(
                "[ModelViewer] Discovered configurable VAR__ meshes:",
                configurableMeshNames,
            );
        }
    }, [configurableMeshNames]);

    // Apply active variant materials
    useMemo(() => {
        if (!activeVariantId) return;

        const variant = config.variants.find((v) => v.id === activeVariantId);
        if (!variant) return;

        // Merge explicit meshTargets with auto-discovered VAR__ meshes
        const allTargets = new Set([
            ...variant.meshTargets,
            ...configurableMeshNames,
        ]);

        clonedScene.traverse((child) => {
            if (
                child instanceof THREE.Mesh &&
                allTargets.has(child.name)
            ) {
                const mat = (child.material as THREE.MeshStandardMaterial).clone();
                if (variant.color) mat.color.set(variant.color);
                if (variant.roughness !== undefined) mat.roughness = variant.roughness;
                if (variant.metalness !== undefined) mat.metalness = variant.metalness;
                // Preserve the boosted reflection
                mat.envMapIntensity = 1.2;
                child.material = mat;
            }
        });
    }, [clonedScene, activeVariantId, config.variants, configurableMeshNames]);

    // NOTE: No idle rotation — it conflicts with CameraControls (user can't
    // rotate freely) and causes Bounds to re-fit every frame (flickering).
    // The user rotates the model via mouse/touch through CameraControls.

    // Click handler for editor selection
    const handleClick = useCallback(
        (e: { stopPropagation: () => void }) => {
            if (isEditor && onSelect) {
                e.stopPropagation();
                onSelect();
            }
        },
        [isEditor, onSelect],
    );

    // PivotControls drag end handler — extracts world position
    const handleDragEnd = useCallback(() => {
        if (groupRef.current && onTransformEnd) {
            const pos = groupRef.current.position;
            onTransformEnd([pos.x, pos.y, pos.z]);
        }
    }, [onTransformEnd]);

    const modelContent = (
        <group
            ref={groupRef}
            position={config.position}
            scale={config.scale}
            onClick={handleClick}
        >
            <primitive object={clonedScene} />

            {/* Hotspot markers (3D, not 2D overlay) */}
            {config.hotspots.map((hotspot) => (
                <HotspotMarker
                    key={hotspot.id}
                    hotspot={hotspot}
                    onSelect={onHotspotClick ?? (() => { })}
                    color={hotspotColor}
                    fontFamily={hotspotFontFamily}
                />
            ))}
        </group>
    );

    // In editor mode + selected: wrap with visual 3D gizmos
    if (isEditor && isSelected) {
        return (
            <PivotControls
                anchor={[0, -1, 0]}
                depthTest={false}
                lineWidth={3}
                scale={0.75}
                onDragEnd={handleDragEnd}
            >
                {modelContent}
            </PivotControls>
        );
    }

    return modelContent;
}
