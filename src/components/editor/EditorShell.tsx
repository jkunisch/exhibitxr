"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, SlidersHorizontal, X } from "lucide-react";
import ViewerCanvas from "@/components/3d/ViewerCanvas";
import ModelViewer from "@/components/3d/ModelViewer";
import EditorForm from "@/components/editor/EditorForm";
import { useEditorStore, type SaveStatus } from "@/store/editorStore";
import {
    useFirestoreExhibit,
    type EditorConfigUpdate,
} from "@/hooks/useFirestoreExhibit";

interface EditorShellProps {
    tenantId: string;
    exhibitId: string;
}

const SAVE_STATUS_STYLES: Record<SaveStatus, { label: string; className: string }> = {
    idle: {
        label: "Bereit",
        className: "border-white/20 text-white/75",
    },
    saving: {
        label: "Speichert…",
        className: "border-amber-300/50 text-amber-200",
    },
    saved: {
        label: "Gespeichert",
        className: "border-emerald-300/50 text-emerald-200",
    },
    error: {
        label: "Fehler",
        className: "border-rose-300/50 text-rose-200",
    },
};

function SaveStatusBadge({
    status,
    error,
}: {
    status: SaveStatus;
    error: string | null;
}) {
    const style = SAVE_STATUS_STYLES[status];

    return (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border bg-black/35 px-3 py-1 text-xs font-medium backdrop-blur-md">
            <span className={style.className}>{style.label}</span>
            {status === "error" && error && (
                <span className="truncate text-rose-200/80" title={error}>
                    {error}
                </span>
            )}
        </div>
    );
}

/**
 * Top-level client component for the editor.
 * Responsive behavior:
 * - Desktop: split view (form left, viewer right)
 * - Tablet: stacked (viewer top, form bottom)
 * - Mobile: viewer only + bottom drawer form
 */
export default function EditorShell({ tenantId, exhibitId }: EditorShellProps) {

    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const { saveToFirestore } = useFirestoreExhibit(tenantId, exhibitId);

    const config = useEditorStore((s) => s.config);
    const ambientIntensity = useEditorStore((s) => s.ambientIntensity);
    const activeVariantId = useEditorStore((s) => s.activeVariantId);
    const activeHotspotId = useEditorStore((s) => s.activeHotspotId);
    const selectedModelId = useEditorStore((s) => s.selectedModelId);
    const setActiveVariant = useEditorStore((s) => s.setActiveVariant);
    const setActiveHotspot = useEditorStore((s) => s.setActiveHotspot);
    const setSelectedModel = useEditorStore((s) => s.setSelectedModel);
    const saveStatus = useEditorStore((s) => s.saveStatus);
    const saveError = useEditorStore((s) => s.saveError);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const handleChange = (event: MediaQueryListEvent) => {
            if (event.matches) {
                setIsMobileDrawerOpen(false);
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    const handleHotspotClick = useCallback(
        (hotspotId: string) => {
            const toggled = activeHotspotId === hotspotId ? null : hotspotId;
            setActiveHotspot(toggled);
        },
        [activeHotspotId, setActiveHotspot]
    );

    const handleConfigChange = useCallback(
        (partial: EditorConfigUpdate) => {
            saveToFirestore(partial);
        },
        [saveToFirestore]
    );

    const handleModelSelect = useCallback(() => {
        if (config) {
            const id = config.model.id;
            setSelectedModel(selectedModelId === id ? null : id);
        }
    }, [config, selectedModelId, setSelectedModel]);

    const handleTransformEnd = useCallback(
        (position: [number, number, number]) => {
            handleConfigChange({
                model: { ...config!.model, position },
            });
        },
        [config, handleConfigChange]
    );

    if (!config) {
        return (
            <div className="flex h-[calc(100dvh-10rem)] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white/60">
                <div className="text-center">
                    <div className="mb-3 text-2xl">⏳</div>
                    <p className="text-sm">Loading exhibition…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100dvh-10rem)] min-h-[560px] flex-col gap-3">
            <header className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 backdrop-blur-xl sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/85">
                            Lighting Studio
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                            {config.title || "Unbenannte Ausstellung"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <SaveStatusBadge status={saveStatus} error={saveError} />
                        <Link
                            href={`/embed/${exhibitId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                        >
                            Vorschau
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="grid h-full grid-cols-1 grid-rows-1 md:grid-rows-[50vh_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)] lg:grid-rows-1">
                    <div className="relative min-h-0 md:row-start-1 md:row-end-2 lg:col-start-2 lg:row-start-1">
                        <ViewerCanvas
                            environment={config.environment}
                            contactShadows={config.contactShadows}
                            bgColor={config.bgColor}
                            ambientIntensity={ambientIntensity}
                            cameraPosition={config.cameraPosition}
                            className="h-full w-full"
                            disableBounds={selectedModelId !== null}
                        >
                            <ModelViewer
                                config={config.model}
                                activeVariantId={activeVariantId}
                                onHotspotClick={handleHotspotClick}
                                isEditor
                                isSelected={selectedModelId === config.model.id}
                                onSelect={handleModelSelect}
                                onTransformEnd={handleTransformEnd}
                            />
                        </ViewerCanvas>

                        {config.model.variants.length > 0 && (
                            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pr-20">
                                {config.model.variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => setActiveVariant(variant.id)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium backdrop-blur-xl transition ${activeVariantId === variant.id
                                            ? "border border-cyan-400/60 bg-cyan-500/20 text-white"
                                            : "border border-white/15 bg-black/40 text-white/80 hover:bg-white/10"
                                            }`}
                                    >
                                        {variant.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeHotspotId && (() => {
                            const hotspot = config.model.hotspots.find((h) => h.id === activeHotspotId);
                            if (!hotspot) return null;
                            return (
                                <div className="absolute bottom-4 right-4 max-w-[280px] rounded-xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur-xl">
                                    <h4 className="mb-1 text-sm font-semibold">{hotspot.label}</h4>
                                    {hotspot.description && (
                                        <p className="text-xs leading-relaxed text-white/70">{hotspot.description}</p>
                                    )}
                                </div>
                            );
                        })()}

                        <button
                            type="button"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-black/55 px-3 py-1.5 text-xs font-semibold text-cyan-100 backdrop-blur-md transition hover:bg-black/75 md:hidden"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Form
                        </button>
                    </div>

                    <div
                        className={`z-30 overflow-y-auto border-white/10 bg-black/55 backdrop-blur-xl transition-transform duration-300 md:row-start-2 md:row-end-3 md:border-t md:bg-black/35 md:translate-y-0 lg:col-start-1 lg:row-start-1 lg:row-end-2 lg:border-r lg:border-t-0 ${isMobileDrawerOpen ? "translate-y-0" : "translate-y-full"
                            } fixed inset-x-0 bottom-0 h-[80vh] rounded-t-2xl border-t md:static md:h-auto md:rounded-none`}
                    >
                        <div className="sticky top-0 z-10 border-b border-white/10 bg-black/60 px-4 py-3 md:hidden">
                            <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-white/25" />
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-white">Editor Controls</p>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="rounded-full border border-white/20 p-1.5 text-white/80"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <EditorForm
                            config={config}
                            ambientIntensity={ambientIntensity}
                            onChange={handleConfigChange}
                        />
                    </div>
                </div>

                {isMobileDrawerOpen && (
                    <button
                        type="button"
                        aria-label="Close editor form drawer"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className="fixed inset-0 z-20 bg-black/55 md:hidden"
                    />
                )}
            </div>
        </div>
    );
}
