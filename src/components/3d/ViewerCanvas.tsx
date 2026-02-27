"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
    Environment,
    ContactShadows,
    OrbitControls,
    PerformanceMonitor,
    Bounds,
    Preload,
    Backdrop,
} from "@react-three/drei";
import { type ReactNode } from "react";
import * as THREE from "three";
import { DEFAULT_AMBIENT_INTENSITY } from "@/lib/lighting";

// ─── Adaptive Quality: Mobile Detection ──────────────────────────────────────
// SSR-safe hook: server renders with `false` (desktop default), client hydrates
// and updates on mount. Uses both viewport width AND userAgent for reliability.
function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const isNarrowViewport = window.innerWidth < 768;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
                .test(navigator.userAgent);
            return isNarrowViewport || isMobileUA;
        };
        setIsMobile(checkMobile());

        // Re-evaluate on resize (e.g. tablet rotation)
        const handleResize = () => setIsMobile(checkMobile());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isMobile;
}

interface ViewerCanvasProps {
    children: ReactNode;
    /** HDRI environment preset name (e.g. "studio", "city", "sunset"). */
    environment?: string;
    /** HDRI Rotation in Radiants (0..2PI). */
    envRotation?: number;
    /** The type of stage/pedestal to render under the model. */
    stageType?: "none" | "pedestal-marble" | "pedestal-wood" | "backdrop-curved";
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
    /** Enable automatic 360° rotation (for TikTok/Reels recording). */
    autoRotate?: boolean;
}

function EnvRotator({ rotationY }: { rotationY: number }) {
    const { scene } = useThree();
    useEffect(() => {
        const s = scene as THREE.Scene & { environmentRotation?: THREE.Euler; backgroundRotation?: THREE.Euler };
        if (s.environmentRotation) {
            s.environmentRotation.set(0, rotationY, 0);
        }
        if (s.backgroundRotation) {
            s.backgroundRotation.set(0, rotationY, 0);
        }
    }, [scene, rotationY]);
    return null;
}

/**
 * R3F Canvas wrapper — enterprise-grade rendering pipeline with adaptive
 * mobile quality throttling.
 *
 * Features:
 * - ACESFilmic tone-mapping for cinematic color grading
 * - OrbitControls with zoom and optional 180° horizontal limit
 * - HDRI Environment with soft blur for natural PBR reflections
 * - Shadow-casting directional light (2048² desktop / 512² mobile)
 * - HemisphereLight to prevent dark undersides
 * - ContactShadows for Apple-style ground shadows (reduced on mobile)
 * - PerformanceMonitor for adaptive DPR scaling
 * - Bounds auto-centering for any loaded model
 * - Preload for eager asset fetching
 *
 * Mobile optimizations:
 * - DPR capped at 1.5 (vs 2.0 desktop) — biggest FPS win on Retina screens
 * - Anti-aliasing disabled — imperceptible on high-density small screens
 * - Shadow map reduced to 512² — prevents GPU stall on Mali/Adreno GPUs
 * - ContactShadows blur + scale reduced — fewer render passes
 */
export default function ViewerCanvas({
    children,
    environment = "studio",
    envRotation = 0,
    stageType = "none",
    contactShadows = true,
    bgColor = "#111111",
    ambientIntensity = DEFAULT_AMBIENT_INTENSITY,
    cameraPosition = [0, 1.5, 4],
    className,
    disableBounds = false,
    restrictOrbitToHalfTurn = false,
    autoRotate = false,
}: ViewerCanvasProps) {
    const isMobile = useIsMobile();

    // ── Adaptive DPR ─────────────────────────────────────────────────────
    // Desktop: dynamic [1, 2] via PerformanceMonitor
    // Mobile: capped at [1, 1.5] — Retina at full DPR murders the GPU
    const [dpr, setDpr] = useState<number | [number, number]>(
        isMobile ? [1, 1.5] : [1, 2],
    );
    const [degraded, setDegraded] = useState(false);

    // Sync DPR range when mobile detection resolves (after hydration)
    useEffect(() => {
        setDpr(isMobile ? [1, 1.5] : [1, 2]);
    }, [isMobile]);

    const handleDecline = useCallback(() => {
        setDpr(1);
        setDegraded(true);
    }, []);

    const handleIncline = useCallback(() => {
        setDpr(isMobile ? [1, 1.5] : [1, 2]);
        setDegraded(false);
    }, [isMobile]);

    // ── Adaptive Quality Constants ───────────────────────────────────────
    // Anti-aliasing: MSAA is the most expensive GL feature on mobile GPUs.
    // On high-density small screens, aliasing is barely visible.
    const antialias = !isMobile;

    // Shadow map: 2048² on desktop for crisp shadows, 512² on mobile to
    // avoid GPU stalls on Mali/Adreno chipsets.
    const shadowMapSize = isMobile ? 512 : 2048;

    // ContactShadows: uses multiple render passes. Reduce quality on mobile.
    const contactShadowBlur = isMobile ? 1.5 : 2.5;
    const contactShadowScale = isMobile ? 10 : 20;

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
                    antialias,
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

                {/* Key light: shadow-casting directional with adaptive shadow map.
                    Desktop: 2048² for crisp shadows.
                    Mobile: 512² to prevent GPU overload. */}
                <directionalLight
                    castShadow
                    position={[5, 10, 5]}
                    intensity={1.2}
                    shadow-mapSize-width={shadowMapSize}
                    shadow-mapSize-height={shadowMapSize}
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
                    <EnvRotator rotationY={envRotation} />
                </Suspense>

                {/* ── Scene Staging (Pedestals & Backdrops) ────────────── */}
                {stageType === "pedestal-marble" && (
                    <mesh receiveShadow position={[0, -0.05, 0]}>
                        <cylinderGeometry args={[1.5, 1.5, 0.1, 64]} />
                        <meshStandardMaterial color="#f8f9fa" roughness={0.1} metalness={0.2} />
                    </mesh>
                )}
                {stageType === "pedestal-wood" && (
                    <mesh receiveShadow position={[0, -0.05, 0]}>
                        <cylinderGeometry args={[1.5, 1.5, 0.1, 64]} />
                        <meshStandardMaterial color="#3e2723" roughness={0.7} metalness={0.0} />
                    </mesh>
                )}
                {stageType === "backdrop-curved" && (
                    <Backdrop
                        receiveShadow
                        floor={2} // amount of floor
                        segments={20} // number of segments
                        position={[0, 0, -3]}
                        scale={[15, 10, 5]}
                    >
                        <meshStandardMaterial color="#f0f0f0" roughness={1} />
                    </Backdrop>
                )}

                {/* ── Ground Contact Shadows (Apple / Spline style) ──────
                     Mobile: reduced blur (1.5 vs 2.5) and scale (10 vs 20)
                     to cut render passes and GPU fill rate. */}
                {contactShadows && !degraded && (
                    <ContactShadows
                        position={[0, 0, 0]}
                        opacity={0.4}
                        scale={contactShadowScale}
                        blur={contactShadowBlur}
                        far={4}
                        color="#1a1a1a"
                    />
                )}

                {/* ── Ground Plane for directional light shadows ─────── */}
                <mesh
                    receiveShadow
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, 0]}
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
                    autoRotate={autoRotate}
                    autoRotateSpeed={4}
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
