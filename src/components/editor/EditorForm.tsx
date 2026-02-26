"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, MousePointerClick } from "lucide-react";
import type { EditorConfigUpdate } from "@/hooks/useFirestoreExhibit";
import {
    AMBIENT_INTENSITY_MAX,
    AMBIENT_INTENSITY_MIN,
    AMBIENT_INTENSITY_STEP,
} from "@/lib/lighting";
import type { ExhibitConfig, ExhibitModel } from "@/types/schema";
import { useEditorStore } from "@/store/editorStore";

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

const ENVIRONMENT_THUMBNAILS: Record<EnvironmentPreset, string> = {
    studio: "from-slate-100/70 via-slate-300/35 to-slate-700/40",
    city: "from-sky-300/60 via-slate-400/25 to-slate-900/55",
    sunset: "from-amber-200/70 via-orange-400/45 to-rose-600/60",
    dawn: "from-rose-200/65 via-orange-200/40 to-sky-400/45",
    night: "from-indigo-300/45 via-slate-900/70 to-black/90",
    warehouse: "from-zinc-200/55 via-zinc-500/40 to-zinc-900/65",
    forest: "from-emerald-200/60 via-emerald-500/35 to-emerald-900/70",
    apartment: "from-stone-100/65 via-stone-300/30 to-stone-600/50",
    park: "from-lime-200/60 via-green-400/40 to-emerald-700/65",
    lobby: "from-amber-100/60 via-amber-300/40 to-slate-700/55",
};

interface EditorFormProps {
    config: ExhibitConfig;
    ambientIntensity: number;
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

/**
 * Editor form panel — edits ExhibitConfig + extended editor controls and
 * calls onChange with strictly typed partial updates.
 */
export default function EditorForm({
    config,
    ambientIntensity,
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
                                            className={`h-10 rounded-lg bg-gradient-to-br ${ENVIRONMENT_THUMBNAILS[preset]}`}
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
                        <input
                            type="range"
                            min={AMBIENT_INTENSITY_MIN}
                            max={AMBIENT_INTENSITY_MAX}
                            step={AMBIENT_INTENSITY_STEP}
                            value={ambientIntensity}
                            onChange={(e) =>
                                onChange({ ambientIntensity: parseFloat(e.target.value) || 0 })
                            }
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400"
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-white/45">
                            <span>{AMBIENT_INTENSITY_MIN}</span>
                            <span>{AMBIENT_INTENSITY_MAX}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <div>
                            <FieldLabel>Hintergrundfarbe</FieldLabel>
                            <FieldHint>Hex-Farbcode für den Szenenhintergrund.</FieldHint>
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

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
