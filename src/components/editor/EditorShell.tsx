"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ExternalLink, Settings, SlidersHorizontal, Sparkles, X, Download, Loader2 } from "lucide-react";
import ViewerCanvas from "@/components/3d/ViewerCanvas";
import ModelViewer from "@/components/3d/ModelViewer";
import EditorForm from "@/components/editor/EditorForm";
import dynamic from "next/dynamic";
const ModelGeneratorPanel = dynamic(
    () => import("@/components/ui/ModelGeneratorPanel").then((mod) => mod.ModelGeneratorPanel),
    { ssr: false, loading: () => <div className="p-8 text-center text-zinc-500">Studio wird geladen...</div> }
);
import { ConciergePanel } from "@/components/ui/ConciergePanel";
import { useEditorStore, type SaveStatus } from "@/store/editorStore";
import {
    useFirestoreExhibit,
    type EditorConfigUpdate,
} from "@/hooks/useFirestoreExhibit";
import { isWallProduct } from "@/lib/viewerOrbit";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

type SidebarTab = "settings" | "generate" | "concierge";

interface EditorShellProps {
    tenantId: string;
    exhibitId: string;
    initialConciergeStatus?: string;
    firebaseCustomToken?: string;
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
export default function EditorShell({
    tenantId,
    exhibitId,
    initialConciergeStatus = "none",
    firebaseCustomToken,
}: EditorShellProps) {

    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("settings");
    const [authReady, setAuthReady] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const { saveToFirestore } = useFirestoreExhibit(tenantId, exhibitId, authReady);

    // Sign in with custom token to establish client-side Firebase Auth
    useEffect(() => {
        if (!firebaseCustomToken) {
            const timer = setTimeout(() => setAuthReady(true), 0); // No token, proceed anyway (maybe already signed in)
            return () => clearTimeout(timer);
        }
        let cancelled = false;
        signInWithCustomToken(auth, firebaseCustomToken)
            .then(() => { if (!cancelled) setAuthReady(true); })
            .catch((err) => {
                console.error("[EditorShell] Custom token sign-in failed:", err);
                if (!cancelled) setAuthReady(true); // Proceed anyway, Firestore will show error
            });
        return () => { cancelled = true; };
    }, [firebaseCustomToken]);

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

    const handleModelGenerated = useCallback(
        (glbUrl: string, usdzUrl?: string) => {
            if (!config) return;
            const updatedModel = { ...config.model, glbUrl, usdzUrl };
            handleConfigChange({ model: updatedModel });
            // Switch to settings tab so user sees the updated model
            setSidebarTab("settings");
        },
        [config, handleConfigChange]
    );

    // Build an effective config: use the real one from Firestore, or a fallback
    // for exhibitions whose data is incomplete/invalid.
    const effectiveConfig = config ?? (saveStatus === "error" ? {
        id: exhibitId,
        tenantId,
        title: "",
        model: {
            id: exhibitId,
            label: "Model",
            glbUrl: "",
            scale: 1,
            position: [0, 0, 0] as [number, number, number],
            variants: [],
            hotspots: [],
        },
        environment: "studio",
        contactShadows: true,
        cameraPosition: [0, 1.5, 4] as [number, number, number],
        bgColor: "#111111",
    } : null);

    if (!effectiveConfig) {
        return (
            <div className="flex h-[calc(100dvh-10rem)] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white/60">
                <div className="text-center">
                    <div className="mb-3 text-2xl">⏳</div>
                    <p className="text-sm">Ausstellung wird geladen…</p>
                </div>
            </div>
        );
    }

    const handleDownload = async () => {
        if (!effectiveConfig.model.glbUrl || isDownloading) return;
        
        setIsDownloading(true);
        try {
            const response = await fetch(effectiveConfig.model.glbUrl);
            if (!response.ok) throw new Error("Download failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            
            const rawTitle = effectiveConfig.title || "Mein_3D_Snap";
            const safeTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
            a.download = `${safeTitle}.glb`;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to download model:", error);
            alert("Download fehlgeschlagen. Bitte versuche es später erneut.");
        } finally {
            setIsDownloading(false);
        }
    };

    const restrictOrbitToHalfTurn = isWallProduct(effectiveConfig);

    return (
        <div className="flex h-[calc(100dvh-10rem)] min-h-[560px] flex-col gap-3">
            <header className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 backdrop-blur-xl sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/85">
                            Lighting Studio
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                            {effectiveConfig.title || "Unbenannte Ausstellung"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <SaveStatusBadge status={saveStatus} error={saveError} />
                        <button
                            onClick={handleDownload}
                            disabled={!effectiveConfig.model.glbUrl || isDownloading}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!effectiveConfig.model.glbUrl ? "Noch kein Modell vorhanden" : "3D-Modell herunterladen (.glb)"}
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Lädt...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Download</span>
                                </>
                            )}
                        </button>
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
                            environment={effectiveConfig.environment}
                            contactShadows={effectiveConfig.contactShadows}
                            bgColor={effectiveConfig.bgColor}
                            ambientIntensity={ambientIntensity}
                            cameraPosition={effectiveConfig.cameraPosition}
                            className="h-full w-full"
                            disableBounds={selectedModelId !== null}
                            restrictOrbitToHalfTurn={restrictOrbitToHalfTurn}
                        >
                            <ModelViewer
                                config={effectiveConfig.model}
                                activeVariantId={activeVariantId}
                                onHotspotClick={handleHotspotClick}
                                isEditor
                                isSelected={selectedModelId === effectiveConfig.model.id}
                                onSelect={handleModelSelect}
                                onTransformEnd={handleTransformEnd}
                            />
                        </ViewerCanvas>

                        {effectiveConfig.model.variants.length > 0 && (
                            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pr-20">
                                {effectiveConfig.model.variants.map((variant) => (
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
                            const hotspot = effectiveConfig.model.hotspots.find((h) => h.id === activeHotspotId);
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
                        className={`z-30 flex flex-col overflow-hidden border-white/10 bg-black/55 backdrop-blur-xl transition-transform duration-300 md:row-start-2 md:row-end-3 md:border-t md:bg-black/35 md:translate-y-0 lg:col-start-1 lg:row-start-1 lg:row-end-2 lg:border-r lg:border-t-0 ${isMobileDrawerOpen ? "translate-y-0" : "translate-y-full"
                            } fixed inset-x-0 bottom-0 h-[80vh] rounded-t-2xl border-t md:static md:h-auto md:rounded-none`}
                    >
                        {/* Mobile drawer header */}
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

                        {/* ── Sidebar Tabs ─────────────────────────── */}
                        <div className="flex shrink-0 border-b border-white/10">
                            <button
                                type="button"
                                onClick={() => setSidebarTab("settings")}
                                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${sidebarTab === "settings"
                                    ? "border-b-2 border-cyan-400 bg-white/5 text-cyan-100"
                                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                                    }`}
                            >
                                <Settings className="h-3.5 w-3.5" />
                                Einstellungen
                            </button>
                            <button
                                type="button"
                                onClick={() => setSidebarTab("generate")}
                                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${sidebarTab === "generate"
                                    ? "border-b-2 border-cyan-400 bg-white/5 text-cyan-100"
                                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                                    }`}
                            >
                                <Camera className="h-3.5 w-3.5" />
                                Foto → 3D
                            </button>
                            <button
                                type="button"
                                onClick={() => setSidebarTab("concierge")}
                                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${sidebarTab === "concierge"
                                    ? "border-b-2 border-purple-400 bg-white/5 text-purple-100"
                                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                                    }`}
                            >
                                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                                Concierge
                            </button>
                        </div>

                        {/* ── Tab Content ──────────────────────────── */}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className={sidebarTab === "settings" ? "" : "hidden"}>
                                <EditorForm
                                    config={effectiveConfig}
                                    ambientIntensity={ambientIntensity}
                                    onChange={handleConfigChange}
                                />
                            </div>
                            <div className={sidebarTab === "generate" ? "p-4" : "hidden"}>
                                <ModelGeneratorPanel
                                    tenantId={tenantId}
                                    exhibitId={exhibitId}
                                    onModelGenerated={handleModelGenerated}
                                />
                            </div>
                            <div className={sidebarTab === "concierge" ? "p-4" : "hidden"}>
                                <ConciergePanel
                                    exhibitId={exhibitId}
                                    initialStatus={initialConciergeStatus}
                                />
                            </div>
                        </div>
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
