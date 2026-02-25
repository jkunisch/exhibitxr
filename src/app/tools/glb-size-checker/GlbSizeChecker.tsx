"use client";

import Link from "next/link";
import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ArrowRight,
    FileBox,
    Sparkles,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Verdict = "green" | "yellow" | "red";

interface AnalysisResult {
    fileName: string;
    sizeBytes: number;
    sizeMB: number;
    verdict: Verdict;
    score: number;
    label: string;
    sublabel: string;
    estimatedLoadTimeSec: number;
}

// ──────────────────────────────────────────────
// Helpers (pure, no side-effects)
// ──────────────────────────────────────────────

const AVERAGE_4G_SPEED_MBPS = 5; // conservative mobile 4G

function analyzeFile(file: File): AnalysisResult {
    const sizeBytes = file.size;
    const sizeMB = sizeBytes / (1024 * 1024);
    const estimatedLoadTimeSec = sizeMB / AVERAGE_4G_SPEED_MBPS;

    let verdict: Verdict;
    let score: number;
    let label: string;
    let sublabel: string;

    if (sizeMB < 2) {
        verdict = "green";
        score = Math.round(90 + (1 - sizeMB / 2) * 10); // 90-100
        label = "Perfekt für E-Commerce.";
        sublabel = "Dein Modell ist schlank und performant.";
    } else if (sizeMB < 5) {
        verdict = "yellow";
        const t = (sizeMB - 2) / 3; // 0‑1 within 2–5 range
        score = Math.round(70 - t * 20); // 70→50
        label = "Grenzwertig. Kostet Mobile-Conversions.";
        sublabel = `Geschätzte Ladezeit: ~${estimatedLoadTimeSec.toFixed(1)}s über 4G`;
    } else {
        verdict = "red";
        const clamped = Math.min(sizeMB, 50);
        score = Math.max(10, Math.round(30 - ((clamped - 5) / 45) * 20)); // 30→10
        label = `Performance-Killer. Ladezeit: ~${Math.round(estimatedLoadTimeSec)} Sekunden (4G).`;
        sublabel = "Dein Modell zerstört die Mobile-Experience deiner Kunden.";
    }

    return {
        fileName: file.name,
        sizeBytes,
        sizeMB,
        verdict,
        score,
        label,
        sublabel,
        estimatedLoadTimeSec,
    };
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const VERDICT_CONFIG: Record<
    Verdict,
    { color: string; bg: string; border: string; ringColor: string; icon: typeof CheckCircle2 }
> = {
    green: {
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        ringColor: "#34d399",
        icon: CheckCircle2,
    },
    yellow: {
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        ringColor: "#fbbf24",
        icon: AlertTriangle,
    },
    red: {
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        ringColor: "#f87171",
        icon: XCircle,
    },
};

// ──────────────────────────────────────────────
// Score Ring (SVG)
// ──────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
            <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
                <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                />
                <motion.circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </svg>
            <motion.span
                className="absolute text-5xl font-black tracking-tight text-white"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
            >
                {score}
            </motion.span>
        </div>
    );
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function GlbSizeChecker() {
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback((file: File | undefined) => {
        if (!file) return;
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext !== "glb" && ext !== "gltf") return;
        setResult(analyzeFile(file));
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            processFile(e.dataTransfer.files[0]);
        },
        [processFile],
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            processFile(e.target.files?.[0]);
        },
        [processFile],
    );

    const verdictCfg = result ? VERDICT_CONFIG[result.verdict] : null;
    const VerdictIcon = verdictCfg?.icon;

    return (
        <div className="min-h-screen bg-[#010102] text-white selection:bg-[#00aaff]/30 overflow-x-hidden font-[family-name:var(--font-inter)]">
            {/* ─── HERO ─── */}
            <section className="relative pt-32 pb-12 lg:pt-44 lg:pb-16 text-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-[#00aaff] uppercase mb-10 backdrop-blur-md"
                >
                    <Sparkles size={12} className="animate-pulse" />
                    Kostenloses Tool
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6 max-w-4xl mx-auto"
                >
                    Dein 3D-Modell{" "}
                    <span className="text-[#00aaff] drop-shadow-[0_0_30px_rgba(0,170,255,0.4)]">
                        ruiniert
                    </span>{" "}
                    deine Shop-Performance.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-base md:text-lg text-zinc-400 mb-16 max-w-2xl mx-auto leading-relaxed font-medium"
                >
                    Ziehe dein <code className="text-zinc-300">.glb</code>-Modell hierher und erfahre sofort,
                    ob es deine Kunden vergraulen wird. 100&nbsp;% lokal im Browser — kein Upload.
                </motion.p>
            </section>

            {/* ─── UPLOAD ZONE ─── */}
            <section className="px-6 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mx-auto max-w-3xl"
                >
                    <div
                        role="button"
                        tabIndex={0}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                        }}
                        className={`
              relative flex flex-col items-center justify-center gap-5
              rounded-[2rem] border-2 border-dashed p-16 md:p-20
              cursor-pointer transition-all duration-300 outline-none
              focus-visible:ring-2 focus-visible:ring-[#00aaff]/60
              ${isDragging
                                ? "border-[#00aaff] bg-[#00aaff]/5 scale-[1.02]"
                                : "border-zinc-700 bg-zinc-950/50 hover:border-zinc-500 hover:bg-zinc-900/40"
                            }
            `}
                    >
                        <motion.div
                            animate={isDragging ? { y: -8, scale: 1.15 } : { y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Upload
                                size={48}
                                className={isDragging ? "text-[#00aaff]" : "text-zinc-500"}
                            />
                        </motion.div>

                        <div className="text-center">
                            <p className="text-lg font-bold text-zinc-200">
                                {isDragging ? "Loslassen zum Analysieren" : "GLB / GLTF Datei hierher ziehen"}
                            </p>
                            <p className="mt-2 text-sm text-zinc-500">
                                oder <span className="text-[#00aaff] underline underline-offset-4">Datei auswählen</span>
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".glb,.gltf"
                            onChange={handleInputChange}
                            className="hidden"
                            id="glb-file-input"
                        />
                    </div>
                </motion.div>
            </section>

            {/* ─── RESULT PANEL ─── */}
            <AnimatePresence mode="wait">
                {result && verdictCfg && VerdictIcon && (
                    <motion.section
                        key={result.fileName + result.sizeBytes}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="px-6 pb-20"
                    >
                        <div
                            className={`
                mx-auto max-w-3xl rounded-[2rem] border p-10 md:p-14
                ${verdictCfg.bg} ${verdictCfg.border}
              `}
                        >
                            {/* Score + Meta */}
                            <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
                                <ScoreRing score={result.score} color={verdictCfg.ringColor} />

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                        <VerdictIcon size={24} className={verdictCfg.color} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                                            Snap Score
                                        </span>
                                    </div>

                                    <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-3 ${verdictCfg.color}`}>
                                        {result.label}
                                    </h2>
                                    <p className="text-sm text-zinc-400 font-medium mb-5">{result.sublabel}</p>

                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-2">
                                            <FileBox size={14} /> {result.fileName}
                                        </span>
                                        <span>{formatBytes(result.sizeBytes)}</span>
                                        <span>~{result.estimatedLoadTimeSec.toFixed(1)}s (4G)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Size Bar */}
                            <div className="rounded-xl bg-black/30 p-1 mb-2">
                                <motion.div
                                    className="h-2 rounded-lg"
                                    style={{ backgroundColor: verdictCfg.ringColor }}
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${Math.min(result.sizeMB / 10, 1) * 100}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                <span>0 MB</span>
                                <span>2 MB</span>
                                <span>5 MB</span>
                                <span>10+ MB</span>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* ─── UPSELL CTA ─── */}
            <section className="px-6 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="mx-auto max-w-3xl rounded-[2rem] border border-[#00aaff]/20 bg-gradient-to-br from-[#00aaff]/5 via-transparent to-transparent p-10 md:p-14 text-center"
                >
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-4">
                        Dein Agentur-Modell ist zu groß?
                    </h3>
                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10 font-medium">
                        3D-Snap generiert dir aus einem Foto in 30&nbsp;Sekunden ein hochkomprimiertes,
                        Draco-optimiertes Asset — ohne Agentur, ohne Wartezeit.
                    </p>

                    <Link
                        href="/register"
                        className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-black text-sm font-black uppercase tracking-widest rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.08)]"
                    >
                        3D-Snap kostenlos testen
                        <ArrowRight
                            size={18}
                            className="transition-transform group-hover:translate-x-1"
                        />
                    </Link>
                </motion.div>
            </section>

            {/* ─── FOOTER MINI ─── */}
            <footer className="border-t border-white/5 py-10 text-center">
                <Link
                    href="/"
                    className="text-lg font-black tracking-tighter text-zinc-600 hover:text-white transition-colors"
                >
                    3D-SNAP<span className="text-[#00aaff] italic">.de</span>
                </Link>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-800">
                    &copy; 2026 ExhibitXR
                </p>
            </footer>
        </div>
    );
}
