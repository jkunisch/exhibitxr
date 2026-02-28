"use client";

import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { createPortal } from "react-dom";
import * as THREE from "three";

interface ModelStats {
    triangles: number;
    meshes: number;
    maxTextureRes: number;
}

function formatTriangles(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

/**
 * Overlay badge shown in the editor's 3D canvas (bottom-right corner).
 *
 * Displays:
 * - Triangle count (e.g. "42.1K tris")
 * - Max texture resolution (e.g. "1024²")
 *
 * Renders via React portal into document.body to avoid R3F DOM constraints.
 * Only visible in editor mode — hidden in embeds.
 */
export function ModelInfoOverlay() {
    const { scene } = useThree();
    const [stats, setStats] = useState<ModelStats | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Traverse the scene to gather geometry statistics
    useEffect(() => {
        if (!scene) return;

        let triangles = 0;
        let meshes = 0;
        let maxTextureRes = 0;

        scene.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            meshes++;

            const geom = child.geometry;
            if (geom) {
                const index = geom.index;
                if (index) {
                    triangles += index.count / 3;
                } else {
                    const pos = geom.attributes.position;
                    if (pos) triangles += pos.count / 3;
                }
            }

            // Check textures for resolution
            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];
            for (const mat of materials) {
                if (!mat) continue;
                const stdMat = mat as THREE.MeshStandardMaterial;
                const maps = [stdMat.map, stdMat.normalMap, stdMat.roughnessMap, stdMat.metalnessMap];
                for (const m of maps) {
                    if (m?.image) {
                        const img = m.image as { width?: number; height?: number };
                        const res = Math.max(img.width || 0, img.height || 0);
                        if (res > maxTextureRes) maxTextureRes = res;
                    }
                }
            }
        });

        setStats({
            triangles: Math.round(triangles),
            meshes,
            maxTextureRes,
        });
    }, [scene, scene.children.length]);

    if (!mounted || !stats || typeof document === "undefined") return null;

    // Find the viewer container to portal into (positioned relative to the canvas)
    const container = document.querySelector("[data-editor-viewer]");
    if (!container) return null;

    return createPortal(
        <div className="absolute bottom-14 right-3 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-mono text-white/60 backdrop-blur-sm">
            <span title={`${stats.triangles.toLocaleString()} Dreiecke`}>
                {formatTriangles(stats.triangles)} tris
            </span>
            {stats.maxTextureRes > 0 && (
                <>
                    <span className="text-white/20">·</span>
                    <span title={`Max. Texturauflösung: ${stats.maxTextureRes}×${stats.maxTextureRes}px`}>
                        {stats.maxTextureRes}²
                    </span>
                </>
            )}
        </div>,
        container,
    );
}
