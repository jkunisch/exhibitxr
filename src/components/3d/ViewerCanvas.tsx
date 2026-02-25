"use client";

import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
    Environment,
    ContactShadows,
    OrbitControls,
    PerformanceMonitor,
    Bounds,
    Preload,
} from "@react-three/drei";
import { type ReactNode } from "react";
import * as THREE from "three";
import { DEFAULT_AMBIENT_INTENSITY } from "@/lib/lighting";

interface ViewerCanvasProps {
    children: ReactNode;
    /** HDRI environment preset name (e.g. "studio", "city", "sunset"). */
    environment?: string;
    /** Show contact shadows beneath the model. */
    contactShadows?: boolean;
    /** Background color (CSS value). */
    bgColor?: string;
    /** Ambient light intensity for base scene illumination. */
    ambientIntensity?: number;
    /** Initial camera position [x, y, z]. */
    cameraPosition?: [number, number, number];
    /** CSS class applied to the wrapper div. */
    className?: string;
    /** Disable Bounds auto-fit (e.g. when using PivotControls in editor). */
    disableBounds?: boolean;
    /** Restrict horizontal orbit rotation to 180° (front-only view). */
    restrictOrbitToHalfTurn?: boolean;
}

/**
 * R3F Canvas wrapper — enterprise-grade rendering pipeline.
 *
 * Features:
 * - ACESFilmic tone-mapping for cinematic color grading
 * - OrbitControls with zoom and optional 180° horizontal limit
 * - HDRI Environment with soft blur for natural PBR reflections
 * - Shadow-casting directional light with 2048² shadow-map
 * - HemisphereLight to prevent dark undersides
 * - ContactShadows for Apple-style ground shadows
 * - PerformanceMonitor for adaptive DPR scaling
 * - Bounds auto-centering for any loaded model
 * - Preload for eager asset fetching
 */
export default function ViewerCanvas({
    children,
    environment = "studio",
    contactShadows = true,
    bgColor = "#111111",
    ambientIntensity = DEFAULT_AMBIENT_INTENSITY,
    cameraPosition = [0, 1.5, 4],
    className,
    disableBounds = false,
    restrictOrbitToHalfTurn = false,
}: ViewerCanvasProps) {
    const [dpr, setDpr] = useState<number | [number, number]>([1, 2]);
    const [degraded, setDegraded] = useState(false);

    const handleDecline = useCallback(() => {
        setDpr(1);
        setDegraded(true);
    }, []);

    const handleIncline = useCallback(() => {
        setDpr([1, 2]);
        setDegraded(false);
    }, []);

    return (
        <div
            className={className}
            style={{ width: "100%", height: "100%", background: bgColor }}
        >
            <Canvas
                shadows
                camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 100 }}
                dpr={dpr}
                gl={{
                    antialias: true,
                    alpha: false,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.15,
                    preserveDrawingBuffer: true,
                }}
            >
                <color attach="background" args={[bgColor]} />

                {/* ── Adaptive Performance ─────────────────────────────── */}
                <PerformanceMonitor
                    onDecline={handleDecline}
                    onIncline={handleIncline}
                />

                {/* ── Lighting Rig ─────────────────────────────────────── */}
                {/* Soft ambient fill — configurable intensity */}
                <ambientLight intensity={ambientIntensity} />

                {/* Hemisphere light: sky color from above, ground color from below.
                    Prevents the bottom half of models from going completely dark. */}
                <hemisphereLight
                    args={["#ffffff", "#444444", 0.5]}
                />

                {/* Key light: shadow-casting directional with softened bias */}
                <directionalLight
                    castShadow
                    position={[5, 10, 5]}
                    intensity={1.2}
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-bias={-0.0001}
                    shadow-camera-near={0.1}
                    shadow-camera-far={50}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10}
                />

                {/* Rim/fill light from the opposite side — no shadows */}
                <directionalLight
                    position={[-3, 5, -5]}
                    intensity={0.35}
                />

                {/* ── HDRI Environment for PBR Reflections ─────────────── */}
                <Suspense fallback={null}>
                    <Environment
                        preset={environment as "studio"}
                        blur={0.8}
                    />
                </Suspense>

                {/* ── Ground Contact Shadows (Apple / Spline style) ────── */}
                {contactShadows && !degraded && (
                    <ContactShadows
                        position={[0, -1.5, 0]}
                        opacity={0.4}
                        scale={20}
                        blur={2.5}
                        far={4}
                        color="#1a1a1a"
                    />
                )}

                {/* ── Ground Plane for directional light shadows ─────── */}
                <mesh
                    receiveShadow
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -1.5, 0]}
                >
                    <planeGeometry args={[50, 50]} />
                    <shadowMaterial transparent opacity={0.1} />
                </mesh>

                {/* ── Model Container ──────────────────────────────────── */}
                {disableBounds ? (
                    children
                ) : (
                    <Bounds fit clip observe margin={1.2}>
                        {children}
                    </Bounds>
                )}

                {/* ── Preload all assets eagerly ───────────────────────── */}
                <Preload all />

                {/* ── OrbitControls: optional 180° horizontal limit ─────── */}
                <OrbitControls
                    makeDefault
                    enablePan={false}
                    enableDamping
                    dampingFactor={0.08}
                    minAzimuthAngle={restrictOrbitToHalfTurn ? -Math.PI / 2 : -Infinity}
                    maxAzimuthAngle={restrictOrbitToHalfTurn ? Math.PI / 2 : Infinity}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI}
                    minDistance={0.5}
                    maxDistance={12}
                />
            </Canvas>
        </div>
    );
}
