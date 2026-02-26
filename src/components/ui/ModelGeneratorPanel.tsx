"use client";

import {
    type ChangeEvent,
    type DragEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Camera, Sparkles, AlertCircle } from "lucide-react";
import { checkStatus, finalizeModel, submitImage, type Provider } from "@/app/actions/generate3d";

// ─── Types ──────────────────────────────────────────────────────────────────

type Step =
    | "idle"
    | "uploading"
    | "removing-bg"
    | "generating"
    | "optimizing"
    | "done"
    | "error";



interface ModelGeneratorPanelProps {
    tenantId: string;
    exhibitId: string;
    onModelGenerated?: (glbUrl: string, usdzUrl?: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const POLL_INTERVAL_MS = 5_000;

const PIPELINE_STEPS: ReadonlyArray<{
    key: Step;
    label: string;
    range: [number, number];
}> = [
        { key: "uploading", label: "Bild wird vorbereitet…", range: [0, 5] },
        { key: "generating", label: "Geometrie wird analysiert…", range: [5, 50] },
        { key: "generating", label: "Texturen werden erstellt…", range: [50, 90] },
        { key: "optimizing", label: "Modell wird optimiert…", range: [90, 100] },
    ];

// ─── Helpers ────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.has(file.type)) {
        return "Ungültiges Format. Erlaubt: PNG, JPEG, WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
        return "Datei ist zu groß. Maximal 10 MB erlaubt.";
    }
    return null;
}

function resolveStepIndex(step: Step, progress: number): number {
    for (let i = PIPELINE_STEPS.length - 1; i >= 0; i--) {
        const entry = PIPELINE_STEPS[i];
        if (step === entry.key && progress >= entry.range[0]) {
            return i;
        }
    }
    return 0;
}

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────

function UploadIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-zinc-400 dark:text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function ErrorIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
        </svg>
    );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ModelGeneratorPanel({
    tenantId,
    exhibitId,
    onModelGenerated,
}: ModelGeneratorPanelProps) {
    const [step, setStep] = useState<Step>("idle");
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [provider, setProvider] = useState<Provider>("premium");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const taskIdRef = useRef<string | null>(null);
    const providerRef = useRef<Provider>("premium");

    // ── File selection ──────────────────────────────────────────────────────

    const handleFile = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setErrorMessage(validationError);
            setStep("error");
            return;
        }

        setErrorMessage(null);
        setStep("idle");
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }, []);

    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);

            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // ── Cleanup preview URL ────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ── Reset ──────────────────────────────────────────────────────────────

    const reset = useCallback(() => {
        setStep("idle");
        setProgress(0);
        setErrorMessage(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        taskIdRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    // ── Polling ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (step !== "generating" && step !== "removing-bg") return;

        const id = taskIdRef.current;
        if (!id) return;

        const intervalId = setInterval(async () => {
            try {
                const result = await checkStatus(id, providerRef.current);

                if (result.status === "FAILED" || result.status === "EXPIRED") {
                    setErrorMessage(result.error ?? "Die 3D-Generierung ist fehlgeschlagen.");
                    setStep("error");
                    return;
                }

                setProgress(result.progress);

                if (result.progress >= 90 && result.status === "IN_PROGRESS") {
                    setStep("optimizing");
                }

                if (result.status === "SUCCEEDED") {
                    setStep("optimizing");
                    setProgress(95);

                    try {
                        const finalResult = await finalizeModel(id, tenantId, exhibitId, providerRef.current);
                        setProgress(100);
                        setStep("done");
                        onModelGenerated?.(finalResult.glbUrl, finalResult.usdzUrl);
                    } catch (finalizeError: unknown) {
                        const msg =
                            finalizeError instanceof Error
                                ? finalizeError.message
                                : "Fehler beim Speichern des Modells.";
                        setErrorMessage(msg);
                        setStep("error");
                    }
                }
            } catch (pollError: unknown) {
                const msg =
                    pollError instanceof Error
                        ? pollError.message
                        : "Fehler bei der Status-Abfrage.";
                setErrorMessage(msg);
                setStep("error");
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [step, tenantId, exhibitId, onModelGenerated]);

    // ── Generate action ────────────────────────────────────────────────────

    const handleGenerate = useCallback(async () => {
        if (!selectedFile) return;

        setStep("uploading");
        setProgress(0);
        setErrorMessage(null);

        try {
            const formData = new FormData();
            formData.set("image", selectedFile);
            formData.set("provider", provider);
            formData.set("exhibitId", exhibitId); // Neu: ID mitgeben
            providerRef.current = provider;

            const result = await submitImage(formData);
            taskIdRef.current = result.taskId;
            setStep("generating");
            setProgress(5);
        } catch (submitError: unknown) {
            const msg =
                submitError instanceof Error
                    ? submitError.message
                    : "Upload fehlgeschlagen.";
            setErrorMessage(msg);
            setStep("error");
        }
    }, [selectedFile, provider]);

    // ── Render: pipeline step list ─────────────────────────────────────────

    const activeStepIndex = resolveStepIndex(step, progress);

    const renderPipelineSteps = () => (
        <ol className="mt-4 space-y-4">
            {PIPELINE_STEPS.map((entry, idx) => {
                const isComplete = idx < activeStepIndex || step === "done";
                const isCurrent = idx === activeStepIndex && step !== "done" && step !== "error";

                return (
                    <li key={`${entry.key}-${entry.range[0]}`} className="flex items-center gap-4 group/step">
                        {/* Step indicator */}
                        <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black transition-all ${isComplete
                                ? "border-green-500/50 bg-green-500/10 text-green-400"
                                : isCurrent
                                    ? "border-[#00aaff] bg-[#00aaff]/10 text-[#00aaff] scale-110 shadow-[0_0_15px_rgba(0,170,255,0.2)]"
                                    : "border-white/5 bg-white/5 text-zinc-600"
                                }`}
                        >
                            {isComplete ? (
                                <CheckIcon />
                            ) : (
                                idx + 1
                            )}
                        </div>

                        {/* Label */}
                        <span
                            className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isComplete
                                ? "text-zinc-400"
                                : isCurrent
                                    ? "text-white"
                                    : "text-zinc-600"
                                }`}
                        >
                            {entry.label}
                        </span>

                        {/* Spinner for current step */}
                        {isCurrent && (
                            <span className="ml-auto h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#00aaff] border-t-transparent" />
                        )}
                    </li>
                );
            })}
        </ol>
    );

    // ── Render: main ───────────────────────────────────────────────────────

    const isProcessing =
        step === "uploading" ||
        step === "removing-bg" ||
        step === "generating" ||
        step === "optimizing";

    return (
        <section className="rounded-[2.5rem] border border-white/5 bg-zinc-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00aaff]/10 blur-3xl rounded-full pointer-events-none" />

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="mb-8 text-center relative z-10">
                <h2 className="text-2xl font-black tracking-tighter text-white">
                    Neuer <span className="text-[#00aaff]">Snap</span>
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Foto zu 3D-Modell in Sekunden
                </p>
            </header>

            {/* ── Provider Toggle ──────────────────────────────────── */}
            <div className="mb-8 flex bg-black/50 p-1.5 rounded-2xl border border-white/5 relative z-10">
                <button
                    type="button"
                    onClick={() => setProvider("basic")}
                    className={`flex-1 rounded-xl py-2.5 text-center transition-all ${provider === "basic"
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    <p className="text-[11px] font-black uppercase tracking-widest">Schnell</p>
                    <p className="text-[9px] font-medium opacity-60">1 Credit</p>
                </button>
                <button
                    type="button"
                    onClick={() => setProvider("premium")}
                    className={`flex-1 rounded-xl py-2.5 text-center transition-all ${provider === "premium"
                        ? "bg-white text-black shadow-md"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    <p className="text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1">Pro <Sparkles size={10} /></p>
                    <p className="text-[9px] font-medium opacity-60">5 Credits</p>
                </button>
            </div>

            {/* ── IDLE: Drop zone ────────────────────────────────────────────── */}
            {step === "idle" && (
                <div className="flex flex-col items-center">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={openFilePicker}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") openFilePicker();
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative group flex aspect-square w-full max-w-[240px] cursor-pointer flex-col items-center justify-center rounded-[3rem] border-2 border-dashed transition-all ${isDragActive
                            ? "border-[#00aaff] bg-[#00aaff]/5"
                            : "border-white/10 bg-white/[0.02] hover:border-[#00aaff]/50 hover:bg-white/[0.05] transition-all"
                            }`}
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Vorschau"
                                className="h-full w-full rounded-[2.8rem] object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center p-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#00aaff] to-[#0066ff] text-white shadow-[0_0_40px_rgba(0,170,255,0.3)] transition-transform group-hover:scale-110">
                                    <Camera size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Magic Capture</p>
                                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">Foto hochladen</p>
                                </div>
                            </div>
                        )}

                        {/* Hover Overlay for change */}
                        {previewUrl && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-[2.8rem] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white">Bild ändern</p>
                            </div>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleInputChange}
                        className="hidden"
                        aria-label="Bilddatei auswählen"
                    />

                    {/* Generate button */}
                    <button
                        type="button"
                        disabled={!selectedFile}
                        onClick={handleGenerate}
                        className={`mt-8 w-full max-w-[240px] rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${selectedFile
                            ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95"
                            : "cursor-not-allowed bg-white/5 text-zinc-600 border border-white/5"
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Sparkles size={14} />
                            3D Snap starten
                        </span>
                    </button>
                    
                    <p className="mt-4 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        PNG, JPEG oder WebP · max. 10 MB
                    </p>
                </div>
            )}

            {/* ── PROCESSING: Progress ───────────────────────────────────────── */}
            {isProcessing && (
                <div className="flex flex-col items-center py-6 relative z-10">
                    {/* Pulsing Loading Orb */}
                    <div className="relative flex h-24 w-24 items-center justify-center mb-8">
                        <div className="absolute inset-0 rounded-full border border-[#00aaff]/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border border-[#00aaff]/40 animate-pulse" />
                        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#00aaff] via-blue-500 to-purple-600 animate-spin shadow-[0_0_30px_rgba(0,170,255,0.4)]" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-0 bg-black/40 rounded-full backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-white font-black text-sm tabular-nums">{progress}%</span>
                        </div>
                    </div>

                    {/* Step list (Modernized) */}
                    <div className="w-full max-w-[240px]">
                        {renderPipelineSteps()}
                    </div>

                    {/* Cancel hint */}
                    <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        KI generiert · In Kürze fertig
                    </p>
                </div>
            )}

            {/* ── DONE ───────────────────────────────────────────────────────── */}
            {step === "done" && (
                <div className="flex flex-col items-center gap-6 py-10 text-center relative z-10">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                        <div className="h-8 w-8 text-green-400">
                            <CheckIcon />
                        </div>
                    </div>

                    <div>
                        <p className="text-lg font-black tracking-tighter text-white uppercase">
                            Erfolg!
                        </p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                            Dein 3D-Modell ist bereit
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={reset}
                        className="mt-4 w-full max-w-[200px] rounded-xl border border-white/10 bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
                    >
                        Neues Modell
                    </button>
                </div>
            )}

            {/* ── ERROR ──────────────────────────────────────────────────────── */}
            {step === "error" && (
                <div className="flex flex-col items-center gap-6 py-10 text-center relative z-10">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                        <AlertCircle className="h-10 w-10 text-rose-500" />
                    </div>

                    <div>
                        <p className="text-lg font-black tracking-tighter text-white uppercase">
                            Fehler
                        </p>
                        {errorMessage && (
                            <p className="max-w-xs text-[10px] font-bold text-rose-400/80 uppercase tracking-widest mt-2 px-4 leading-relaxed">
                                {errorMessage}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={reset}
                        className="mt-4 w-full max-w-[200px] rounded-xl bg-white py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
                    >
                        Erneut versuchen
                    </button>
                </div>
            )}
        </section>
    );
}
