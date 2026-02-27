"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface ControlsLegendProps {
    /** Whether the model is currently selected (PivotControls active). */
    isModelSelected: boolean;
}

const STORAGE_KEY = "exhibitxr.studio.controlsLegend.open.v1";

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (target.isContentEditable) return true;
    return false;
}

export default function ControlsLegend({ isModelSelected }: ControlsLegendProps) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [isTouch, setIsTouch] = useState(false);

    // Hydration-safe bootstrapping
    useEffect(() => {
        setMounted(true);

        const touch =
            typeof window !== "undefined" &&
            ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);
        setIsTouch(touch);

        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            // Default: open on first visit
            setOpen(stored === null ? true : stored === "1");
        } catch {
            setOpen(true);
        }
    }, []);

    // Persist open/closed state
    useEffect(() => {
        if (!mounted) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
        } catch {
            // localStorage blocked — ignore
        }
    }, [mounted, open]);

    // Keyboard toggles: "?" or "H"
    useEffect(() => {
        if (!mounted) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented) return;
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (isEditableTarget(event.target)) return;

            const key = event.key;
            if (key !== "?" && key.toLowerCase() !== "h") return;

            event.preventDefault();
            setOpen((prev) => !prev);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mounted]);

    const sections = useMemo(() => {
        const camera = isTouch
            ? ["1 Finger ziehen: Kamera drehen", "Pinch: Zoomen"]
            : ["Klicken & ziehen: Kamera drehen", "Scroll / Mausrad: Zoomen"];

        const model = (() => {
            if (isTouch) {
                return isModelSelected
                    ? ["Gizmo ziehen: Modell verschieben", "Tippen ins Leere: Auswahl aufheben"]
                    : ["Tippen: Modell auswählen", "Dann: Gizmo ziehen → verschieben"];
            }
            return isModelSelected
                ? ["Gizmo ziehen: Modell verschieben", "ESC oder Klick ins Leere: Auswahl aufheben"]
                : ["Klick: Modell auswählen", "Dann: Gizmo ziehen → verschieben"];
        })();

        return { camera, model };
    }, [isTouch, isModelSelected]);

    // SSR guard — render only after mount
    if (!mounted) return null;

    return (
        <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-[300px]">
            {/* Toggle button — only this is clickable */}
            <div className="pointer-events-auto inline-flex">
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-expanded={open}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-black/70"
                    title={open ? "Steuerungs-Hilfe ausblenden" : "Steuerungs-Hilfe einblenden"}
                >
                    <HelpCircle className="h-4 w-4 text-cyan-200" />
                    <span>Steuerung</span>
                    {open ? (
                        <ChevronUp className="h-4 w-4 text-white/70" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-white/70" />
                    )}
                </button>
            </div>

            {/* Legend panel — pointer-events-none so camera drag works through it */}
            {open && (
                <div className="pointer-events-none mt-2 rounded-xl border border-white/15 bg-black/55 p-3 text-white/90 shadow-lg backdrop-blur-xl">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-white">
                                Steuerungs‑Legende
                            </p>
                            <p className="mt-0.5 text-[11px] text-white/60">
                                Modus: {isModelSelected ? "Modell bearbeiten" : "Kamera"}
                            </p>
                        </div>
                        <p className="text-[11px] text-white/50">(H / ?)</p>
                    </div>

                    <div className="space-y-3 text-[12px] leading-relaxed text-white/80">
                        <LegendSection title="Kamera" items={sections.camera} />
                        <LegendSection title="Modell" items={sections.model} />
                        <LegendSection title="Shortcut" items={["H oder ?: Hilfe ein/aus"]} />
                    </div>
                </div>
            )}
        </div>
    );
}

function LegendSection({ title, items }: { title: string; items: string[] }) {
    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                {title}
            </p>
            <ul className="mt-1 space-y-1">
                {items.map((item) => (
                    <li key={item} className="flex gap-2">
                        <span className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full bg-cyan-300/70" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
