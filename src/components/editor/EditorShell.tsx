"use client";

import { useCallback, useRef } from "react";
import type CameraControlsImpl from "camera-controls";
import ViewerCanvas from "@/components/3d/ViewerCanvas";
import ModelViewer from "@/components/3d/ModelViewer";
import EditorForm from "@/components/editor/EditorForm";
import { useEditorStore } from "@/store/editorStore";
import { useFirestoreExhibit } from "@/hooks/useFirestoreExhibit";
import type { ExhibitConfig } from "@/types/schema";

interface EditorShellProps {
    tenantId: string;
    exhibitId: string;
}

/**
 * Top-level client component for the editor.
 * Split layout: form (left) + 3D viewer (right).
 * Wires Firestore sync, store, and camera fly-to.
 */
export default function EditorShell({ tenantId, exhibitId }: EditorShellProps) {
    const cameraRef = useRef<CameraControlsImpl | null>(null);
    const { saveToFirestore } = useFirestoreExhibit(tenantId, exhibitId);

    const config = useEditorStore((s) => s.config);
    const activeVariantId = useEditorStore((s) => s.activeVariantId);
    const activeHotspotId = useEditorStore((s) => s.activeHotspotId);
    const setActiveVariant = useEditorStore((s) => s.setActiveVariant);
    const setActiveHotspot = useEditorStore((s) => s.setActiveHotspot);

    const handleHotspotClick = useCallback(
        (hotspotId: string) => {
            const toggled = activeHotspotId === hotspotId ? null : hotspotId;
            setActiveHotspot(toggled);

            if (toggled && cameraRef.current && config) {
                const hotspot = config.model.hotspots.find((h) => h.id === toggled);
                if (hotspot?.cameraPosition && hotspot?.cameraTarget) {
                    const [px, py, pz] = hotspot.cameraPosition;
                    const [tx, ty, tz] = hotspot.cameraTarget;
                    cameraRef.current.setLookAt(px, py, pz, tx, ty, tz, true);
                }
            }
        },
        [activeHotspotId, setActiveHotspot, config]
    );

    const handleConfigChange = useCallback(
        (partial: Partial<ExhibitConfig>) => {
            saveToFirestore(partial);
        },
        [saveToFirestore]
    );

    if (!config) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center text-white/60">
                <div className="text-center">
                    <div className="mb-3 text-2xl">⏳</div>
                    <p className="text-sm">Loading exhibition…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-4 overflow-hidden rounded-2xl border border-white/10">
            {/* Left: Editor Form */}
            <div className="w-[400px] shrink-0 overflow-y-auto border-r border-white/10 bg-black/30 backdrop-blur-xl">
                <EditorForm config={config} onChange={handleConfigChange} />
            </div>

            {/* Right: 3D Viewer */}
            <div className="relative flex-1">
                <ViewerCanvas
                    environment={config.environment}
                    contactShadows={config.contactShadows}
                    bgColor={config.bgColor}
                    cameraPosition={config.cameraPosition}
                    cameraControlsRef={cameraRef}
                    className="h-full w-full"
                >
                    <ModelViewer
                        config={config.model}
                        activeVariantId={activeVariantId}
                        onHotspotClick={handleHotspotClick}
                    />
                </ViewerCanvas>

                {/* Variant Switcher Overlay */}
                {config.model.variants.length > 0 && (
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        {config.model.variants.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setActiveVariant(v.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium backdrop-blur-xl transition ${activeVariantId === v.id
                                        ? "border border-cyan-400/60 bg-cyan-500/20 text-white"
                                        : "border border-white/15 bg-black/40 text-white/80 hover:bg-white/10"
                                    }`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Active Hotspot Info */}
                {activeHotspotId && (() => {
                    const hs = config.model.hotspots.find((h) => h.id === activeHotspotId);
                    if (!hs) return null;
                    return (
                        <div className="absolute bottom-4 right-4 max-w-[260px] rounded-xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur-xl">
                            <h4 className="mb-1 text-sm font-semibold">{hs.label}</h4>
                            {hs.description && (
                                <p className="text-xs leading-relaxed text-white/70">{hs.description}</p>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
