"use client";

import { useCallback } from "react";
import { useEditorStore, type SaveStatus } from "@/store/editorStore";
import type { ExhibitConfig, ExhibitModel } from "@/types/schema";

interface EditorFormProps {
    config: ExhibitConfig;
    onChange: (partial: Partial<ExhibitConfig>) => void;
}

function SaveIndicator({ status, error }: { status: SaveStatus; error: string | null }) {
    const styles: Record<SaveStatus, { label: string; color: string }> = {
        idle: { label: "", color: "" },
        saving: { label: "💾 Saving…", color: "text-yellow-400" },
        saved: { label: "✓ Saved", color: "text-emerald-400" },
        error: { label: "⚠ Error", color: "text-red-400" },
    };
    const s = styles[status];
    if (!s.label) return null;

    return (
        <div className={`flex items-center gap-2 text-xs ${s.color}`}>
            <span>{s.label}</span>
            {error && status === "error" && (
                <span className="max-w-[200px] truncate text-red-300/70" title={error}>
                    {error}
                </span>
            )}
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
            {children}
        </label>
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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
        />
    );
}

/**
 * Editor form panel — edits ExhibitConfig fields and calls onChange with partials.
 */
export default function EditorForm({ config, onChange }: EditorFormProps) {
    const saveStatus = useEditorStore((s) => s.saveStatus);
    const saveError = useEditorStore((s) => s.saveError);

    const updateModel = useCallback(
        (partial: Partial<ExhibitModel>) => {
            onChange({ model: { ...config.model, ...partial } });
        },
        [config.model, onChange]
    );

    return (
        <div className="flex flex-col gap-6 p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-base font-semibold text-white">Editor</h2>
                <SaveIndicator status={saveStatus} error={saveError} />
            </div>

            {/* General */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400/80">General</h3>
                <div>
                    <FieldLabel>Title</FieldLabel>
                    <TextInput value={config.title} onChange={(v) => onChange({ title: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <FieldLabel>Environment</FieldLabel>
                        <select
                            value={config.environment}
                            onChange={(e) => onChange({ environment: e.target.value })}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50"
                        >
                            {["studio", "city", "sunset", "dawn", "night", "warehouse", "forest", "apartment", "park", "lobby"].map((p) => (
                                <option key={p} value={p} className="bg-slate-900">{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>BG Color</FieldLabel>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={config.bgColor}
                                onChange={(e) => onChange({ bgColor: e.target.value })}
                                className="h-9 w-9 cursor-pointer rounded border border-white/10 bg-transparent"
                            />
                            <TextInput value={config.bgColor} onChange={(v) => onChange({ bgColor: v })} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Model */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400/80">Model</h3>
                <div>
                    <FieldLabel>GLB URL</FieldLabel>
                    <TextInput value={config.model.glbUrl} onChange={(v) => updateModel({ glbUrl: v })} placeholder="https://…/model.glb" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <FieldLabel>Label</FieldLabel>
                        <TextInput value={config.model.label} onChange={(v) => updateModel({ label: v })} />
                    </div>
                    <div>
                        <FieldLabel>Scale</FieldLabel>
                        <NumberInput value={config.model.scale} onChange={(v) => updateModel({ scale: v })} step={0.1} min={0.01} />
                    </div>
                </div>
            </section>

            {/* Variants */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400/80">Variants ({config.model.variants.length})</h3>
                {config.model.variants.map((variant, vi) => (
                    <div key={variant.id} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Label</FieldLabel>
                                <TextInput value={variant.label} onChange={(v) => { const variants = [...config.model.variants]; variants[vi] = { ...variant, label: v }; updateModel({ variants }); }} />
                            </div>
                            <div>
                                <FieldLabel>Color</FieldLabel>
                                <div className="flex gap-2">
                                    <input type="color" value={variant.color ?? "#ffffff"} onChange={(e) => { const variants = [...config.model.variants]; variants[vi] = { ...variant, color: e.target.value }; updateModel({ variants }); }} className="h-9 w-9 cursor-pointer rounded border border-white/10 bg-transparent" />
                                    <TextInput value={variant.color ?? ""} onChange={(v) => { const variants = [...config.model.variants]; variants[vi] = { ...variant, color: v || undefined }; updateModel({ variants }); }} />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Roughness</FieldLabel>
                                <NumberInput value={variant.roughness ?? 0.5} onChange={(v) => { const variants = [...config.model.variants]; variants[vi] = { ...variant, roughness: v }; updateModel({ variants }); }} min={0} max={1} step={0.05} />
                            </div>
                            <div>
                                <FieldLabel>Metalness</FieldLabel>
                                <NumberInput value={variant.metalness ?? 0} onChange={(v) => { const variants = [...config.model.variants]; variants[vi] = { ...variant, metalness: v }; updateModel({ variants }); }} min={0} max={1} step={0.05} />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Hotspots */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400/80">Hotspots ({config.model.hotspots.length})</h3>
                {config.model.hotspots.map((hotspot, hi) => (
                    <div key={hotspot.id} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div>
                            <FieldLabel>Label</FieldLabel>
                            <TextInput value={hotspot.label} onChange={(v) => { const hotspots = [...config.model.hotspots]; hotspots[hi] = { ...hotspot, label: v }; updateModel({ hotspots }); }} />
                        </div>
                        <div>
                            <FieldLabel>Description</FieldLabel>
                            <textarea value={hotspot.description ?? ""} onChange={(e) => { const hotspots = [...config.model.hotspots]; hotspots[hi] = { ...hotspot, description: e.target.value || undefined }; updateModel({ hotspots }); }} rows={2} className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25" />
                        </div>
                        <div>
                            <FieldLabel>Position [x, y, z]</FieldLabel>
                            <div className="grid grid-cols-3 gap-2">
                                {([0, 1, 2] as const).map((axis) => (
                                    <NumberInput key={axis} value={hotspot.position[axis]} onChange={(v) => { const hotspots = [...config.model.hotspots]; const pos: [number, number, number] = [...hotspot.position]; pos[axis] = v; hotspots[hi] = { ...hotspot, position: pos }; updateModel({ hotspots }); }} step={0.05} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
