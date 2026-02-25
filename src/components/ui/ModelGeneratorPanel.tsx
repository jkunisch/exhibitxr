"use client";

import {
    type ChangeEvent,
    type DragEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

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
    onModelGenerated?: (glbUrl: string) => void;
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
                        onModelGenerated?.(finalResult.glbUrl);
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
        <ol className="mt-4 space-y-3">
            {PIPELINE_STEPS.map((entry, idx) => {
                const isComplete = idx < activeStepIndex || step === "done";
                const isCurrent = idx === activeStepIndex && step !== "done" && step !== "error";

                return (
                    <li key={`${entry.key}-${entry.range[0]}`} className="flex items-center gap-3">
                        {/* Step indicator */}
                        <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${isComplete
                                ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                : isCurrent
                                    ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400"
                                    : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                                }`}
                        >
                            {isComplete ? (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            ) : (
                                idx + 1
                            )}
                        </span>

                        {/* Label */}
                        <span
                            className={`text-sm transition-colors ${isComplete
                                ? "text-emerald-700 dark:text-emerald-300"
                                : isCurrent
                                    ? "font-medium text-zinc-800 dark:text-zinc-100"
                                    : "text-zinc-400 dark:text-zinc-500"
                                }`}
                        >
                            {entry.label}
                        </span>

                        {/* Spinner for current step */}
                        {isCurrent && (
                            <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
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
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="mb-4">
                <h2 className="text-base font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                    Bild → 3D-Modell
                </h2>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    KI-generierte 3D-Modelle
                </p>
            </header>

            {/* ── Provider Toggle ──────────────────────────────────── */}
            <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setProvider("basic")}
                    className={`rounded-lg border px-3 py-2.5 text-left transition ${provider === "basic"
                        ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                        }`}
                >
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Basic</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Tripo · Schnell</p>
                </button>
                <button
                    type="button"
                    onClick={() => setProvider("premium")}
                    className={`rounded-lg border px-3 py-2.5 text-left transition ${provider === "premium"
                        ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                        }`}
                >
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Premium ✨</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Meshy · Hochwertig</p>
                </button>
            </div>

            {/* ── IDLE: Drop zone ────────────────────────────────────────────── */}
            {step === "idle" && (
                <>
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
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${isDragActive
                            ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                            : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                            }`}
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Vorschau des ausgewählten Bildes"
                                className="mb-3 max-h-40 rounded-md object-contain"
                            />
                        ) : (
                            <UploadIcon />
                        )}

                        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {previewUrl ? "Anderes Bild auswählen" : "Bild hochladen oder hierher ziehen"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            PNG, JPEG oder WebP · max. 10 MB
                        </p>
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
                        className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${selectedFile
                            ? "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                            : "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                            }`}
                    >
                        3D-Modell generieren
                    </button>
                </>
            )}

            {/* ── PROCESSING: Progress ───────────────────────────────────────── */}
            {isProcessing && (
                <div>
                    {/* Progress bar */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <p className="mt-2 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        {progress}%
                    </p>

                    {/* Step list */}
                    {renderPipelineSteps()}

                    {/* Cancel hint */}
                    <p className="mt-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
                        Die Generierung kann bis zu 5 Minuten dauern.
                    </p>
                </div>
            )}

            {/* ── DONE ───────────────────────────────────────────────────────── */}
            {step === "done" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                        <CheckIcon />
                    </div>

                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        3D-Modell erfolgreich erstellt!
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Das Modell wurde gespeichert und ist bereit zur Anzeige.
                    </p>

                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={reset}
                            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            Neues Bild
                        </button>
                    </div>
                </div>
            )}

            {/* ── ERROR ──────────────────────────────────────────────────────── */}
            {step === "error" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                        <ErrorIcon />
                    </div>

                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        Fehler bei der Generierung
                    </p>
                    {errorMessage && (
                        <p className="max-w-xs text-xs text-red-600 dark:text-red-400">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={reset}
                        className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        Erneut versuchen
                    </button>
                </div>
            )}
        </section>
    );
}
