"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { create } from "zustand";
import * as THREE from "three";

// ─── Shared store for model stats ────────────────────────────────────────────
interface ModelStats {
    triangles: number;
    maxTextureRes: number;
}

interface ModelStatsStore {
    stats: ModelStats | null;
    setStats: (s: ModelStats | null) => void;
}

export const useModelStatsStore = create<ModelStatsStore>((set) => ({
    stats: null,
    setStats: (stats) => set({ stats }),
}));

function formatTriangles(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

/**
 * R3F component — must be placed INSIDE the <Canvas>.
 *
 * Traverses the scene to gather geometry/texture statistics and writes
 * them to the shared `useModelStatsStore`. The actual DOM overlay is
 * rendered by `ModelInfoOverlayHUD` *outside* the Canvas to avoid the
 * "Div is not part of THREE namespace" R3F error.
 */
export function ModelStatsGatherer() {
    const { scene } = useThree();
    const setStats = useModelStatsStore((s) => s.setStats);

    useEffect(() => {
        let triangles = 0;
        let maxTextureRes = 0;

        scene.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;

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
            maxTextureRes,
        });

        return () => setStats(null);
    }, [scene, scene.children.length, setStats]);

    // Renders nothing into the 3D scene — purely a stats gatherer
    return null;
}

/**
 * DOM component — must be placed OUTSIDE the <Canvas>.
 *
 * Reads stats from `useModelStatsStore` and renders an overlay badge
 * positioned over the canvas via absolute positioning.
 */
export function ModelInfoOverlayHUD() {
    const stats = useModelStatsStore((s) => s.stats);

    if (!stats || stats.triangles === 0) return null;

    return (
        <div className="absolute bottom-14 right-3 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-mono text-white/60 backdrop-blur-sm pointer-events-none">
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
        </div>
    );
}
