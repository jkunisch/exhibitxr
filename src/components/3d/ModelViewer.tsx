"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { useGLTF, PivotControls } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { resolveVariantTargetMeshNames, type VariantMeshDescriptor } from "@/lib/variantTargets";
import type { ExhibitModel as ExhibitModelType } from "@/types/schema";
import HotspotMarker from "./HotspotMarker";
import { useEditorStore } from "@/store/editorStore";

/** Google-hosted Draco decoder for up to 80% smaller GLB payloads. */
const DRACO_DECODER_PATH =
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

/** Prefix for meshes that should be treated as configurable variants. */
const VAR_PREFIX = "VAR__";

interface ModelViewerProps {
    config: ExhibitModelType;
    /** Start-Animation beim Laden des Modells. */
    entryAnimation?: "none" | "float" | "drop" | "spin-in";
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
    /** Called when the GLB model has been fully loaded and is ready for display. */
    onLoaded?: () => void;
    /** Called when user clicks this model in editor mode. */
    onSelect?: () => void;
    /** Called when PivotControls drag ends with the new world position. */
    onTransformEnd?: (position: [number, number, number]) => void;
}

type MeshWithUserData = THREE.Mesh & {
    userData: THREE.Object3D["userData"] & {
        baseMaterials?: THREE.Material[];
    };
};

function toMaterialArray(material: THREE.Material | THREE.Material[]): THREE.Material[] {
    return Array.isArray(material) ? material : [material];
}

function withEnvironmentBoost(material: THREE.Material): THREE.Material {
    const cloned = material.clone();
    if ("envMapIntensity" in cloned) {
        (cloned as THREE.MeshStandardMaterial).envMapIntensity = 1.2;
    }
    cloned.needsUpdate = true;
    return cloned;
}

function applyVariantToMaterial(
    material: THREE.Material,
    variant: ExhibitModelType["variants"][number],
): THREE.Material {
    const nextMaterial = material.clone();

    if (variant.color && "color" in nextMaterial) {
        (nextMaterial as THREE.MeshStandardMaterial).color.set(variant.color);
    }
    if (variant.roughness !== undefined && "roughness" in nextMaterial) {
        (nextMaterial as THREE.MeshStandardMaterial).roughness = variant.roughness;
    }
    if (variant.metalness !== undefined && "metalness" in nextMaterial) {
        (nextMaterial as THREE.MeshStandardMaterial).metalness = variant.metalness;
    }
    if ("envMapIntensity" in nextMaterial) {
        (nextMaterial as THREE.MeshStandardMaterial).envMapIntensity = 1.2;
    }
    nextMaterial.needsUpdate = true;

    return nextMaterial;
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
    entryAnimation = "none",
    activeVariantId,
    onHotspotClick,
    hotspotColor = "#00aaff",
    hotspotFontFamily = "system-ui, sans-serif",
    isEditor = false,
    isSelected = false,
    onLoaded,
    onSelect,
    onTransformEnd,
}: ModelViewerProps) {
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
        entryAnimation={entryAnimation}
        activeVariantId={activeVariantId}
        onHotspotClick={onHotspotClick}
        hotspotColor={hotspotColor}
        hotspotFontFamily={hotspotFontFamily}
        isEditor={isEditor}
        isSelected={isSelected}
        onLoaded={onLoaded}
        onSelect={onSelect}
        onTransformEnd={onTransformEnd}
    />;
}

function ModelViewerInner({
    config,
    entryAnimation = "none",
    activeVariantId,
    onHotspotClick,
    hotspotColor = "#00aaff",
    hotspotFontFamily = "system-ui, sans-serif",
    isEditor = false,
    isSelected = false,
    onLoaded,
    onSelect,
    onTransformEnd,
}: ModelViewerProps) {
    const groupRef = useRef<THREE.Group>(null);
    const setPickedMeshName = useEditorStore((s) => s.setPickedMeshName);

    // Call onLoaded once the model is ready
    useEffect(() => {
        if (onLoaded) onLoaded();
    }, [onLoaded]);
    
    // Sicherung gegen ungültige URLs
    const isValidUrl = typeof config.glbUrl === 'string' && config.glbUrl.startsWith('http');
    
    // Wir rufen useGLTF nur auf, wenn wir eine valide URL haben.
    // Falls nicht, nutzen wir null.
    const { scene } = useGLTF(isValidUrl ? config.glbUrl : '/fallback.glb', DRACO_DECODER_PATH);

    // Clone scene to avoid polluting the GLTF cache
    const clonedScene = useMemo(() => {
        if (!isValidUrl || !scene) return null;
        const clone = scene.clone(true);
        clone.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                const mesh = node as MeshWithUserData;
                // Shadows: every mesh casts and receives
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // Boost PBR reflections from the HDRI environment
                const boostedMaterials = toMaterialArray(mesh.material).map((material) =>
                    withEnvironmentBoost(material),
                );

                mesh.material = boostedMaterials.length === 1
                    ? boostedMaterials[0]
                    : boostedMaterials;
                mesh.userData.baseMaterials = boostedMaterials.map((material) => material.clone());
            }
        });
        return clone;
    }, [isValidUrl, scene]);

    // Discover meshes with VAR__ prefix for automatic variant targeting
    const configurableMeshNames = useMemo(() => {
        const names: string[] = [];
        if (!clonedScene) return names;
        
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name.startsWith(VAR_PREFIX)) {
                names.push(child.name);
            }
        });
        return names;
    }, [clonedScene]);

    const meshDescriptors = useMemo(() => {
        const descriptors: VariantMeshDescriptor[] = [];
        if (!clonedScene) return descriptors;

        clonedScene.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) {
                return;
            }

            const groupNames: string[] = [];
            let parent: THREE.Object3D | null = child.parent;
            while (parent) {
                if (typeof parent.name === "string" && parent.name.trim().length > 0) {
                    groupNames.push(parent.name);
                }
                parent = parent.parent;
            }

            const materialNames = toMaterialArray(child.material)
                .map((material) => material.name?.trim() ?? "")
                .filter((materialName) => materialName.length > 0);

            descriptors.push({
                meshName: child.name,
                groupNames,
                materialNames,
            });
        });

        return descriptors;
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
    useEffect(() => {
        if (!clonedScene) return;

        clonedScene.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) {
                return;
            }

            const mesh = child as MeshWithUserData;
            const baseMaterials = mesh.userData.baseMaterials;
            if (!baseMaterials || baseMaterials.length === 0) {
                return;
            }

            const resetMaterials = baseMaterials.map((material) => material.clone());
            mesh.material = resetMaterials.length === 1 ? resetMaterials[0] : resetMaterials;
        });

        if (!activeVariantId) return;

        const variant = config.variants.find((v) => v.id === activeVariantId);
        if (!variant) return;

        const allTargets = resolveVariantTargetMeshNames(
            meshDescriptors,
            variant.meshTargets,
            configurableMeshNames,
        );

        clonedScene.traverse((child) => {
            if (!(child instanceof THREE.Mesh) || !allTargets.has(child.name)) {
                return;
            }

            const nextMaterials = toMaterialArray(child.material).map((material) =>
                applyVariantToMaterial(material, variant),
            );

            child.material = nextMaterials.length === 1 ? nextMaterials[0] : nextMaterials;
        });
    }, [activeVariantId, clonedScene, config.variants, configurableMeshNames, meshDescriptors]);

    // NOTE: No idle rotation — it conflicts with CameraControls (user can't
    // rotate freely) and causes Bounds to re-fit every frame (flickering).
    // The user rotates the model via mouse/touch through CameraControls.

    // Click handler for editor selection & mesh picking
    const handleClick = useCallback(
        (e: ThreeEvent<MouseEvent>) => {
            if (!isEditor) return;

            // Don't intercept if clicking the PivotControls gizmo
            if (isSelected && e.object.parent?.name?.includes("PivotControls")) return;

            e.stopPropagation(); // Stop propagation so we don't trigger background clicks

            if (onSelect) {
                onSelect();
            }

            if (e.object && e.object.name) {
                setPickedMeshName(`mesh:${e.object.name}`);
            }
        },
        [isEditor, isSelected, onSelect, setPickedMeshName],
    );

    // PivotControls drag end handler — extracts world position
    const handleDragEnd = useCallback(() => {
        if (groupRef.current && onTransformEnd) {
            const pos = groupRef.current.position;
            onTransformEnd([pos.x, pos.y, pos.z]);
        }
    }, [onTransformEnd]);

    // Spring Animation Setup (Drop & Spin-in)
    const [springProps, api] = useSpring(() => {
        const isDrop = entryAnimation === "drop";
        const isSpin = entryAnimation === "spin-in";
        return {
            position: [
                config.position[0],
                isDrop ? config.position[1] + 5 : config.position[1],
                config.position[2]
            ] as [number, number, number],
            scale: isSpin ? 0 : config.scale,
            rotation: [0, isSpin ? Math.PI * 2 : 0, 0] as [number, number, number],
            config: { mass: 1, tension: 170, friction: 26 },
        };
    }, [config.position, config.scale, entryAnimation]);

    // Trigger initial animations if model is cloned/ready
    useEffect(() => {
        if (!clonedScene) return;

        if (entryAnimation === "drop") {
            api.start({
                position: [config.position[0], config.position[1], config.position[2]],
                scale: config.scale,
                rotation: [0, 0, 0],
                config: { mass: 2, tension: 120, friction: 14 },
            });
        } else if (entryAnimation === "spin-in") {
            api.start({
                position: [config.position[0], config.position[1], config.position[2]],
                scale: config.scale,
                rotation: [0, 0, 0],
                config: { mass: 1, tension: 100, friction: 20 },
            });
        } else {
            api.start({
                position: [config.position[0], config.position[1], config.position[2]],
                scale: config.scale,
                rotation: [0, 0, 0],
                immediate: true,
            });
        }
        // Use primitive dependencies to prevent animation loops when parent re-renders
    }, [
        entryAnimation,
        config.position[0],
        config.position[1],
        config.position[2],
        config.scale,
        api,
        clonedScene,
    ]);

    // Float Animation
    useFrame((state) => {
        if (entryAnimation === "float" && groupRef.current && (!isEditor || !isSelected)) {
            groupRef.current.position.y = config.position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
        }
    });

    const modelContent = (
        <animated.group
            ref={groupRef}
            position={springProps.position as any}
            scale={springProps.scale as any}
            rotation={springProps.rotation as any}
            onClick={handleClick}
        >
            {clonedScene ? (
                <primitive object={clonedScene} />
            ) : (
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#1a1a1a" wireframe />
                </mesh>
            )}

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
        </animated.group>
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
