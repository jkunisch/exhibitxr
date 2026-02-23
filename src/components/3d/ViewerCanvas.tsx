"use client";

import { Canvas } from "@react-three/fiber";
import {
    Environment,
    ContactShadows,
    CameraControls,
} from "@react-three/drei";
import { type RefObject, type ReactNode } from "react";
import type CameraControlsImpl from "camera-controls";

interface ViewerCanvasProps {
    children: ReactNode;
    /** HDRI environment preset name (e.g. "studio", "city", "sunset"). */
    environment?: string;
    /** Show contact shadows beneath the model. */
    contactShadows?: boolean;
    /** Background color (CSS value). */
    bgColor?: string;
    /** Initial camera position [x, y, z]. */
    cameraPosition?: [number, number, number];
    /** Optional ref to CameraControls for programmatic fly-to. */
    cameraControlsRef?: RefObject<CameraControlsImpl | null>;
    /** CSS class applied to the wrapper div. */
    className?: string;
}

/**
 * R3F Canvas wrapper with Environment, ContactShadows,
 * and CameraControls pre-configured. Pass 3D children inside.
 */
export default function ViewerCanvas({
    children,
    environment = "studio",
    contactShadows = true,
    bgColor = "#111111",
    cameraPosition = [0, 1.5, 4],
    cameraControlsRef,
    className,
}: ViewerCanvasProps) {
    return (
        <div
            className={className}
            style={{ width: "100%", height: "100%", background: bgColor }}
        >
            <Canvas
                camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 100 }}
                gl={{ antialias: true, alpha: false }}
            >
                <color attach="background" args={[bgColor]} />

                <Environment preset={environment as "studio"} />

                {contactShadows && (
                    <ContactShadows
                        position={[0, -0.01, 0]}
                        opacity={0.6}
                        scale={10}
                        blur={2.5}
                        far={4}
                    />
                )}

                {children}

                <CameraControls
                    ref={cameraControlsRef}
                    makeDefault
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2}
                    minDistance={1.5}
                    maxDistance={8}
                />
            </Canvas>
        </div>
    );
}
