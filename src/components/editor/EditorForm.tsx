"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Loader2, MousePointerClick, Zap, Sparkles } from "lucide-react";
import { optimizeModelAction } from "@/app/actions/optimizeModel";
import { upscaleTexturesAction } from "@/app/actions/upscaleTextures";
import { getMyCredits } from "@/app/actions/credits";
import type { EditorConfigUpdate } from "@/hooks/useFirestoreExhibit";
import {
    AMBIENT_INTENSITY_MAX,
    AMBIENT_INTENSITY_MIN,
    AMBIENT_INTENSITY_STEP,
} from "@/lib/lighting";
import type { ExhibitConfig, ExhibitModel } from "@/types/schema";
import { useEditorStore } from "@/store/editorStore";
import PremiumSlider from "@/components/ui/PremiumSlider";

const ENVIRONMENT_PRESETS = [
    "studio",
    "city",
    "sunset",
    "dawn",
    "night",
    "warehouse",
    "forest",
    "apartment",
    "park",
    "lobby",
] as const;

type EnvironmentPreset = (typeof ENVIRONMENT_PRESETS)[number];
type SectionKey = "general" | "lighting" | "model" | "variants" | "hotspots";

/** Rich multi-stop CSS gradients that visually represent each HDRI environment. */
const ENVIRONMENT_THUMBNAILS: Record<EnvironmentPreset, string> = {
    studio: "radial-gradient(ellipse at 50% 30%, #e8e8e8 0%, #b0b0b0 40%, #6b6b6b 80%, #3a3a3a 100%)",
    city: "linear-gradient(135deg, #1a2a4a 0%, #2d4a7a 30%, #4a7ab0 55%, #e8a040 85%, #f0c060 100%)",
    sunset: "linear-gradient(to bottom, #2a1a3a 0%, #8a3060 25%, #e86040 50%, #f0a040 75%, #f8d080 100%)",
    dawn: "linear-gradient(to bottom, #2a2a5a 0%, #6a4a8a 25%, #c07090 50%, #e8a890 75%, #f0d0b0 100%)",
    night: "radial-gradient(ellipse at 40% 40%, #1a1a3a 0%, #0a0a20 50%, #050510 100%)",
    warehouse: "radial-gradient(ellipse at 50% 20%, #c8a060 0%, #8a7050 35%, #4a3a30 65%, #2a2020 100%)",
    forest: "radial-gradient(ellipse at 50% 60%, #90c060 0%, #508040 30%, #2a5030 60%, #1a3020 100%)",
    apartment: "radial-gradient(ellipse at 70% 30%, #f0e0c0 0%, #c0a880 30%, #806850 60%, #4a3a30 100%)",
    park: "linear-gradient(to bottom, #60a0e0 0%, #80c0f0 30%, #a0d8a0 60%, #60a050 80%, #408030 100%)",
    lobby: "radial-gradient(ellipse at 50% 40%, #f0d8a0 0%, #c0a060 30%, #806040 60%, #3a2a20 100%)",
};

interface MaterialPreset {
    label: string;
    icon: string;
    color?: string; // If undefined, we keep the user's current color
    roughness: number;
    metalness: number;
    className: string;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
    { label: "Matte", icon: "🌫️", roughness: 0.9, metalness: 0, className: "bg-zinc-800 text-zinc-300 border-zinc-700" },
    { label: "Plastik", icon: "🧱", roughness: 0.35, metalness: 0, className: "bg-blue-900/40 text-blue-300 border-blue-800/50" },
    { label: "Chrom", icon: "✨", color: "#e0e0e0", roughness: 0.05, metalness: 1.0, className: "bg-slate-300 text-slate-900 border-slate-400" },
    { label: "Gold", icon: "🏆", color: "#ffd700", roughness: 0.15, metalness: 1.0, className: "bg-amber-400 text-amber-950 border-amber-500" },
    { label: "Cyberpunk", icon: "🔮", color: "#ff003c", roughness: 0.2, metalness: 0.8, className: "bg-rose-900/60 text-rose-300 border-rose-700" },
];

interface EditorFormProps {
    config: ExhibitConfig;
    ambientIntensity: number;
    exhibitId: string;
    onChange: (partial: EditorConfigUpdate) => void;
}

interface SectionProps {
    section: SectionKey;
    title: string;
    description: string;
    isOpen: boolean;
    onToggle: (section: SectionKey) => void;
    children: ReactNode;
}

function FieldLabel({ children }: { children: ReactNode }) {
    return (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
            {children}
        </label>
    );
}

function FieldHint({ children }: { children: ReactNode }) {
    return (
        <p className="mb-2.5 text-[11px] leading-relaxed text-white/35">
            {children}
        </p>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
        />
    );
}

function NumberInput({
    value,
    onChange,
    step = 0.1,
    min,
    max,
}: {
    value: number;
    onChange: (v: number) => void;
    step?: number;
    min?: number;
    max?: number;
}) {
    return (
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step={step}
            min={min}
            max={max}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
        />
    );
}

function Section({
    section,
    title,
    description,
    isOpen,
    onToggle,
    children,
}: SectionProps) {
    return (
        <section className="rounded-2xl border border-white/10 bg-slate-900/45">
            <button
                type="button"
                onClick={() => onToggle(section)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-0.5 text-xs text-white/55">{description}</p>
                </div>
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-white/60" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-white/60" />
                )}
            </button>
            {isOpen && (
                <div className="space-y-4 border-t border-white/10 px-4 py-4">
                    {children}
                </div>
            )}
        </section>
    );
}

function parseVariantTargets(input: string): string[] {
    return input
        .split(/[\n,]+/)
        .map((target) => target.trim())
        .filter((target) => target.length > 0);
}

function formatVariantTargets(targets: string[]): string {
    return targets.join(", ");
}

// ── Pro Optimize Button ──────────────────────────────────────────────────────
// Self-contained component with loading, error, and success states.

function OptimizeButton({
    exhibitId,
    glbUrl,
    onChange,
}: {
    exhibitId: string;
    glbUrl: string;
    onChange: (partial: EditorConfigUpdate) => void;
}) {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        originalSizeKB: number;
        optimizedSizeKB: number;
        reductionPercent: number;
    } | null>(null);

    const handleOptimize = useCallback(async () => {
        if (isOptimizing || !glbUrl) return;

        setIsOptimizing(true);
        setError(null);
        setResult(null);

        try {
            const res = await optimizeModelAction(exhibitId, glbUrl);

            if (res.ok) {
                setResult({
                    originalSizeKB: res.originalSizeKB,
                    optimizedSizeKB: res.optimizedSizeKB,
                    reductionPercent: res.reductionPercent,
                });
                // Update the editor store with the new optimized URL
                onChange({ model: { glbUrl: res.glbUrl } as ExhibitModel });
            } else {
                setError(res.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
        } finally {
            setIsOptimizing(false);
        }
    }, [exhibitId, glbUrl, isOptimizing, onChange]);

    return (
        <div className="border-t border-white/10 pt-4">
            <button
                type="button"
                disabled={isOptimizing || !glbUrl}
                onClick={handleOptimize}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isOptimizing ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Optimierung läuft…
                    </>
                ) : (
                    <>
                        <Zap className="h-4 w-4" />
                        Modell optimieren &amp; komprimieren
                    </>
                )}
            </button>

            {result && (
                <div className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    <p className="font-semibold">
                        ✓ Optimiert: {result.originalSizeKB} KB → {result.optimizedSizeKB} KB
                        <span className="ml-1 text-emerald-300">(↓{result.reductionPercent}%)</span>
                    </p>
                </div>
            )}

            {error && (
                <div className="mt-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {error}
                </div>
            )}
        </div>
    );
}

// ── Premium Upscale Button ───────────────────────────────────────────────────

function UpscaleButton({
    exhibitId,
    glbUrl,
    onChange,
}: {
    exhibitId: string;
    glbUrl: string;
    onChange: (partial: EditorConfigUpdate) => void;
}) {
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);

    // Fetch credits on mount
    useEffect(() => {
        getMyCredits()
            .then((res) => setCredits(res.credits))
            .catch((err) => console.error("Could not fetch credits", err));
    }, []);

    const handleUpscale = useCallback(async () => {
        if (isUpscaling || !glbUrl || (credits !== null && credits < 1)) return;

        setIsUpscaling(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await upscaleTexturesAction(exhibitId, glbUrl);

            if (res.ok) {
                setSuccess(true);
                // Update credits locally
                setCredits((prev) => (prev !== null ? prev - 1 : null));
                onChange({ model: { glbUrl: res.glbUrl } as ExhibitModel });
            } else {
                setError(res.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
        } finally {
            setIsUpscaling(false);
        }
    }, [exhibitId, glbUrl, isUpscaling, credits, onChange]);

    return (
        <div className="border-t border-white/10 pt-4">
            <button
                type="button"
                disabled={isUpscaling || !glbUrl || (credits !== null && credits < 1)}
                onClick={handleUpscale}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isUpscaling ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Texturen werden hochskaliert…
                    </>
                ) : (
                    <>
                        <Sparkles className="h-4 w-4" />
                        Texturen auf 4K hochskalieren (1 Credit)
                    </>
                )}
            </button>

            {credits !== null && credits < 1 && (
                <p className="mt-2 text-center text-xs text-rose-300/80">
                    Nicht genügend Credits für dieses Premium-Feature.
                </p>
            )}

            {success && (
                <div className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    <p className="font-semibold">✓ Texturen erfolgreich hochskaliert!</p>
                </div>
            )}

            {error && (
                <div className="mt-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {error}
                </div>
            )}
        </div>
    );
}

/**
 * Editor form panel — edits ExhibitConfig + extended editor controls and
 * calls onChange with strictly typed partial updates.
 */
export default function EditorForm({
    config,
    ambientIntensity,
    exhibitId,
    onChange,
}: EditorFormProps) {
    const pickedMeshName = useEditorStore((s) => s.pickedMeshName);
    const setPickedMeshName = useEditorStore((s) => s.setPickedMeshName);

    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
        general: true,
        lighting: true,
        model: true,
        variants: true,
        hotspots: true,
    });

    const toggleSection = useCallback((section: SectionKey) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const updateModel = useCallback(
        (partial: Partial<ExhibitModel>) => {
            onChange({ model: { ...config.model, ...partial } });
        },
        [config.model, onChange]
    );

    const ambientLabel = useMemo(() => ambientIntensity.toFixed(1), [ambientIntensity]);

    const addVariant = useCallback((prefilledTarget?: string) => {
        const nextVariantIndex = config.model.variants.length + 1;
        const nextVariant = {
            id: `variant-${Date.now()}-${nextVariantIndex}`,
            label: `Variante ${nextVariantIndex}`,
            meshTargets: prefilledTarget ? [prefilledTarget] : [],
            color: "#ffffff",
            roughness: 0.5,
            metalness: 0,
        };

        updateModel({ variants: [...config.model.variants, nextVariant] });
        if (prefilledTarget) setPickedMeshName(null);
    }, [config.model.variants, updateModel, setPickedMeshName]);

    const removeVariant = useCallback((variantId: string) => {
        updateModel({
            variants: config.model.variants.filter((variant) => variant.id !== variantId),
        });
    }, [config.model.variants, updateModel]);

    return (
        <div className="flex h-full flex-col">
            <div className="space-y-4 p-4 sm:p-5">
                <Section
                    section="general"
                    title="Allgemein"
                    description="Titel und Szenenumgebung verwalten."
                    isOpen={openSections.general}
                    onToggle={toggleSection}
                >
                    <div>
                        <FieldLabel>Titel</FieldLabel>
                        <FieldHint>Name der Ausstellung — wird im Dashboard und Embed angezeigt.</FieldHint>
                        <TextInput value={config.title} onChange={(v) => onChange({ title: v })} />
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <FieldLabel>Bühne & Set</FieldLabel>
                        <FieldHint>Stelle dein Produkt auf ein elegantes Podest.</FieldHint>
                        <select
                            value={config.stageType ?? "none"}
                            onChange={(e) => onChange({ stageType: e.target.value as ExhibitConfig["stageType"] })}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
                        >
                            <option value="none">Keine Bühne (Freischwebend)</option>
                            <option value="pedestal-marble">Podest (Glänzender Marmor)</option>
                            <option value="pedestal-wood">Podest (Mattes Holz)</option>
                            <option value="backdrop-curved">Fotostudio (Hohlkehle)</option>
                        </select>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <FieldLabel>Start-Animation</FieldLabel>
                        <FieldHint>Animation beim Laden des 3D-Modells.</FieldHint>
                        <div className="flex items-center gap-2">
                            <select
                                value={config.entryAnimation ?? "none"}
                                onChange={(e) => onChange({ entryAnimation: e.target.value as ExhibitConfig["entryAnimation"] })}
                                className="flex-1 appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
                            >
                                <option value="none">Keine</option>
                                <option value="float">Sanftes Schweben</option>
                                <option value="drop">Drop-In</option>
                                <option value="spin-in">Spin</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => useEditorStore.getState().replayAnimation()}
                                disabled={!config.entryAnimation || config.entryAnimation === "none"}
                                title="Animation abspielen"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 text-white/70 transition hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                            <FieldLabel>HDRI Umgebung</FieldLabel>
                            <span className="text-xs text-cyan-300/80">{config.environment}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {ENVIRONMENT_PRESETS.map((preset) => {
                                const isActive = config.environment === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => onChange({ environment: preset })}
                                        className={`group rounded-xl border p-2 text-left transition ${isActive
                                            ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                                            : "border-white/15 bg-black/25 hover:border-white/35"
                                            }`}
                                    >
                                        <div
                                            className="h-10 rounded-lg"
                                            style={{ background: ENVIRONMENT_THUMBNAILS[preset] }}
                                        />
                                        <p
                                            className={`mt-1.5 text-xs font-medium capitalize ${isActive ? "text-cyan-200" : "text-white/80 group-hover:text-white"
                                                }`}
                                        >
                                            {preset}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </Section>

                <Section
                    section="lighting"
                    title="Beleuchtung"
                    description="Lichtstimmung und Schatten live steuern."
                    isOpen={openSections.lighting}
                    onToggle={toggleSection}
                >
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <FieldLabel>Umgebungslicht</FieldLabel>
                            <span className="text-xs font-semibold text-cyan-200">{ambientLabel}</span>
                        </div>
                        <PremiumSlider
                            value={ambientIntensity}
                            onChange={(v) => onChange({ ambientIntensity: v })}
                            min={AMBIENT_INTENSITY_MIN}
                            max={AMBIENT_INTENSITY_MAX}
                            step={AMBIENT_INTENSITY_STEP}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-white/45">
                            <span>{AMBIENT_INTENSITY_MIN}</span>
                            <span>{AMBIENT_INTENSITY_MAX}</span>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                            <FieldLabel>Licht-Rotation (HDRI)</FieldLabel>
                            <span className="text-xs font-semibold text-cyan-200">
                                {Math.round(((config.envRotation || 0) * 180) / Math.PI)}°
                            </span>
                        </div>
                        <PremiumSlider
                            value={config.envRotation || 0}
                            onChange={(v) => onChange({ envRotation: v })}
                            min={0}
                            max={Math.PI * 2}
                            step={0.05}
                            formatValue={(v) => `${Math.round((v * 180) / Math.PI)}°`}
                        />
                        <FieldHint>Drehe die Lichtquelle, um Spiegelungen perfekt zu setzen.</FieldHint>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] border-t border-white/10 pt-4 mt-4">
                        <div>
                            <FieldLabel>Hintergrundfarbe</FieldLabel>
                            <FieldHint>Wähle einen Preset oder gib einen Hex-Farbcode ein.</FieldHint>
                            <div className="my-2 flex flex-wrap gap-1.5">
                                {[
                                    { hex: "#000000", label: "OLED Black" },
                                    { hex: "#0A0E1A", label: "Deep Navy" },
                                    { hex: "#111111", label: "Studio" },
                                    { hex: "#1A1A1A", label: "Anthrazit" },
                                    { hex: "#2A2A2A", label: "Dark Grey" },
                                    { hex: "#3A3A3A", label: "Medium Grey" },
                                    { hex: "#F0F0F0", label: "Off-White" },
                                    { hex: "#FFFFFF", label: "Pure White" },
                                ].map((swatch) => (
                                    <button
                                        key={swatch.hex}
                                        type="button"
                                        title={`${swatch.label} (${swatch.hex})`}
                                        onClick={() => onChange({ bgColor: swatch.hex })}
                                        className={`h-7 w-7 rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95 ${config.bgColor.toUpperCase() === swatch.hex.toUpperCase()
                                            ? "border-cyan-400 ring-2 ring-cyan-400/40 scale-110"
                                            : "border-white/20 hover:border-white/50"
                                            }`}
                                        style={{ backgroundColor: swatch.hex }}
                                    />
                                ))}
                            </div>
                            <TextInput value={config.bgColor} onChange={(v) => onChange({ bgColor: v })} />
                        </div>
                        <div className="sm:pt-6">
                            <input
                                type="color"
                                value={config.bgColor}
                                onChange={(e) => onChange({ bgColor: e.target.value })}
                                className="h-10 w-14 cursor-pointer rounded-xl border border-white/15 bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-medium text-white">Kontaktschatten</p>
                            <p className="text-xs text-white/55">
                                Weiche Kontaktschatten unter dem Modell.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={config.contactShadows}
                            onClick={() => onChange({ contactShadows: !config.contactShadows })}
                            className={`relative h-7 w-12 rounded-full border transition ${config.contactShadows
                                ? "border-cyan-400/60 bg-cyan-500/25"
                                : "border-white/20 bg-white/10"
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition ${config.contactShadows ? "left-6" : "left-0.5"
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-medium text-white">Turntable Animation</p>
                            <p className="text-xs text-white/55">
                                Modell dreht sich automatisch — pausiert bei Interaktion.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={config.autoRotate}
                            onClick={() => onChange({ autoRotate: !config.autoRotate })}
                            className={`relative h-7 w-12 rounded-full border transition ${config.autoRotate
                                ? "border-cyan-400/60 bg-cyan-500/25"
                                : "border-white/20 bg-white/10"
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition ${config.autoRotate ? "left-6" : "left-0.5"
                                    }`}
                            />
                        </button>
                    </div>
                </Section>

                <Section
                    section="model"
                    title="Modell"
                    description="3D-Datei, Bezeichnung und Skalierung."
                    isOpen={openSections.model}
                    onToggle={toggleSection}
                >
                    <div>
                        <FieldLabel>Modell-URL (GLB)</FieldLabel>
                        <FieldHint>URL zur .glb Datei — wird automatisch gesetzt wenn du ein Foto generierst.</FieldHint>
                        <TextInput
                            value={config.model.glbUrl}
                            onChange={(v) => updateModel({ glbUrl: v })}
                            placeholder="https://…/model.glb"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <FieldLabel>Bezeichnung</FieldLabel>
                            <TextInput value={config.model.label} onChange={(v) => updateModel({ label: v })} />
                        </div>
                        <div>
                            <FieldLabel>Skalierung</FieldLabel>
                            <NumberInput
                                value={config.model.scale}
                                onChange={(v) => updateModel({ scale: v })}
                                step={0.1}
                                min={0.01}
                            />
                        </div>
                    </div>

                    {/* ── Pro Optimize (Decimation) ──────────────────── */}
                    <OptimizeButton
                        exhibitId={exhibitId}
                        glbUrl={config.model.glbUrl}
                        onChange={onChange}
                    />

                    {/* ── Premium Upscale (Textures) ──────────────────── */}
                    <UpscaleButton
                        exhibitId={exhibitId}
                        glbUrl={config.model.glbUrl}
                        onChange={onChange}
                    />
                </Section>

                <Section
                    section="variants"
                    title={`Varianten (${config.model.variants.length})`}
                    description="Farbvarianten und Materialoptionen für das 3D-Modell."
                    isOpen={openSections.variants}
                    onToggle={toggleSection}
                >
                    {pickedMeshName && (
                        <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-cyan-200 text-xs font-semibold">
                                <MousePointerClick size={14} />
                                <span>Teil markiert: {pickedMeshName.replace("mesh:", "")}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => addVariant(pickedMeshName)}
                                className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-white shadow-md transition hover:bg-cyan-400 active:scale-95"
                            >
                                Variante für dieses Teil erstellen
                            </button>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => addVariant()}
                            className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                        >
                            Variante hinzufügen
                        </button>
                    </div>

                    {config.model.variants.length === 0 && (
                        <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-2 text-xs text-white/60">
                            Keine Varianten vorhanden.
                        </p>
                    )}

                    {config.model.variants.map((variant, vi) => (
                        <div key={variant.id} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <FieldLabel>Label</FieldLabel>
                                    <TextInput
                                        value={variant.label}
                                        onChange={(v) => {
                                            const variants = [...config.model.variants];
                                            variants[vi] = { ...variant, label: v };
                                            updateModel({ variants });
                                        }}
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Color</FieldLabel>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={variant.color ?? "#ffffff"}
                                            onChange={(e) => {
                                                const variants = [...config.model.variants];
                                                variants[vi] = { ...variant, color: e.target.value };
                                                updateModel({ variants });
                                            }}
                                            className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent"
                                        />
                                        <TextInput
                                            value={variant.color ?? ""}
                                            onChange={(v) => {
                                                const variants = [...config.model.variants];
                                                variants[vi] = { ...variant, color: v || undefined };
                                                updateModel({ variants });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <FieldLabel>Targets (mesh/group/material)</FieldLabel>
                                <FieldHint>
                                    Kommagetrennt: <code>mesh:Name</code>, <code>group:Name</code> oder <code>material:Name</code>.
                                </FieldHint>
                                <TextInput
                                    value={formatVariantTargets(variant.meshTargets)}
                                    onChange={(v) => {
                                        const variants = [...config.model.variants];
                                        variants[vi] = {
                                            ...variant,
                                            meshTargets: parseVariantTargets(v),
                                        };
                                        updateModel({ variants });
                                    }}
                                    placeholder="group:Body, material:Paint, mesh:Wheel_FL"
                                />
                            </div>

                            {/* ── Quick Style Presets ──────────────────────────────── */}
                            <div className="pt-2">
                                <FieldLabel>Style Presets</FieldLabel>
                                <div className="flex flex-wrap gap-2">
                                    {MATERIAL_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => {
                                                const variants = [...config.model.variants];
                                                variants[vi] = {
                                                    ...variant,
                                                    roughness: preset.roughness,
                                                    metalness: preset.metalness,
                                                    // Only overwrite color if the preset strictly dictates one
                                                    ...(preset.color ? { color: preset.color } : {}),
                                                };
                                                updateModel({ variants });
                                            }}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition hover:scale-105 active:scale-95 ${preset.className}`}
                                        >
                                            <span>{preset.icon}</span>
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* ──────────────────────────────────────────────────────── */}

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-white/5">
                                <div>
                                    <FieldLabel>Roughness</FieldLabel>
                                    <NumberInput
                                        value={variant.roughness ?? 0.5}
                                        onChange={(v) => {
                                            const variants = [...config.model.variants];
                                            variants[vi] = { ...variant, roughness: v };
                                            updateModel({ variants });
                                        }}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Metalness</FieldLabel>
                                    <NumberInput
                                        value={variant.metalness ?? 0}
                                        onChange={(v) => {
                                            const variants = [...config.model.variants];
                                            variants[vi] = { ...variant, metalness: v };
                                            updateModel({ variants });
                                        }}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-white/10 pt-2">
                                <button
                                    type="button"
                                    onClick={() => removeVariant(variant.id)}
                                    className="rounded-lg border border-rose-400/50 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/25"
                                >
                                    Variante entfernen
                                </button>
                            </div>
                        </div>
                    ))}
                </Section>

                <Section
                    section="hotspots"
                    title={`Hotspots (${config.model.hotspots.length})`}
                    description="Interaktive Info-Punkte auf dem 3D-Modell."
                    isOpen={openSections.hotspots}
                    onToggle={toggleSection}
                >
                    {config.model.hotspots.length === 0 && (
                        <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-2 text-xs text-white/60">
                            Keine Hotspots vorhanden.
                        </p>
                    )}

                    {config.model.hotspots.map((hotspot, hi) => (
                        <div key={hotspot.id} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                            <div>
                                <FieldLabel>Label</FieldLabel>
                                <TextInput
                                    value={hotspot.label}
                                    onChange={(v) => {
                                        const hotspots = [...config.model.hotspots];
                                        hotspots[hi] = { ...hotspot, label: v };
                                        updateModel({ hotspots });
                                    }}
                                />
                            </div>

                            <div>
                                <FieldLabel>Description</FieldLabel>
                                <textarea
                                    value={hotspot.description ?? ""}
                                    onChange={(e) => {
                                        const hotspots = [...config.model.hotspots];
                                        hotspots[hi] = {
                                            ...hotspot,
                                            description: e.target.value || undefined,
                                        };
                                        updateModel({ hotspots });
                                    }}
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
                                />
                            </div>

                            <div>
                                <FieldLabel>Position [x, y, z]</FieldLabel>
                                <div className="grid grid-cols-3 gap-2">
                                    {([0, 1, 2] as const).map((axis) => (
                                        <NumberInput
                                            key={axis}
                                            value={hotspot.position[axis]}
                                            onChange={(v) => {
                                                const hotspots = [...config.model.hotspots];
                                                const pos: [number, number, number] = [...hotspot.position];
                                                pos[axis] = v;
                                                hotspots[hi] = { ...hotspot, position: pos };
                                                updateModel({ hotspots });
                                            }}
                                            step={0.05}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </Section>
            </div>
        </div>
    );
}
