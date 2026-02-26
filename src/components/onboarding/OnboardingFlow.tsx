'use client';

import React, { useReducer, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Camera, Box, Play, Check, UploadCloud, Copy, Edit2, Loader2, Mail } from 'lucide-react';

import { EnvironmentPicker, ENVIRONMENTS } from './EnvironmentPicker';
import { ConfettiExplosion } from './ConfettiExplosion';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

// Real Actions
import { createExhibitionAction, updateExhibitionAction } from '@/app/actions/exhibitions';
import { submitImage, checkStatus, finalizeModel } from '@/app/actions/generate3d';
import { uploadGlbFile } from '@/lib/storage';

type PathType = 'photo' | 'upload' | 'demo';

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

// --- State Machine Typisierung ---
type OnboardingState =
    | { step: 'welcome' }
    | { step: 'choose_path'; selectedPath?: PathType }
    | { step: 'configure'; path: PathType; title: string; environment: string }
    | { step: 'processing'; path: PathType; exhibitionId: string; title: string; environment: string }
    | { step: 'checklist'; exhibitionId: string; title: string; environment: string; glbUrl: string };

type OnboardingAction =
    | { type: 'START' }
    | { type: 'SELECT_PATH'; path: PathType }
    | { type: 'CONFIGURE'; title: string; environment: string }
    | { type: 'CREATED'; exhibitionId: string }
    | { type: 'PROCESSING_DONE'; glbUrl: string }
    | { type: 'BACK' }
    | { type: 'SKIP' };

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
    switch (action.type) {
        case 'START':
            return { step: 'choose_path' };
        case 'SELECT_PATH':
            if (state.step === 'choose_path') return { ...state, selectedPath: action.path };
            return state;
        case 'CONFIGURE':
            if (state.step === 'choose_path' && state.selectedPath) {
                return { step: 'configure', path: state.selectedPath, title: action.title, environment: action.environment };
            }
            if (state.step === 'configure') {
                return { ...state, title: action.title, environment: action.environment };
            }
            return state;
        case 'CREATED':
            if (state.step === 'configure') {
                return { step: 'processing', path: state.path, exhibitionId: action.exhibitionId, title: state.title, environment: state.environment };
            }
            return state;
        case 'PROCESSING_DONE':
            if (state.step === 'processing') {
                return { step: 'checklist', exhibitionId: state.exhibitionId, title: state.title, environment: state.environment, glbUrl: action.glbUrl };
            }
            return state;
        case 'BACK':
            if (state.step === 'choose_path') return { step: 'welcome' };
            if (state.step === 'configure') return { step: 'choose_path', selectedPath: state.path };
            return state;
        case 'SKIP':
            return state;
        default:
            return state;
    }
}

// --- Haupt-Komponente ---
export function OnboardingFlow({ tenantId, onDismiss }: { tenantId: string; onDismiss: () => void }) {
    const [state, dispatch] = useReducer(reducer, { step: 'welcome' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onDismiss();
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onDismiss]);

    const handleCreate = async () => {
        if (state.step !== 'configure') return;
        setIsCreating(true);
        try {
            if (state.path === 'demo') {
                const demoId = `demo-${Date.now()}`;
                dispatch({ type: 'CREATED', exhibitionId: demoId });
                dispatch({ type: 'PROCESSING_DONE', glbUrl: '' });
                return;
            }

            const formData = new FormData();
            formData.append('title', state.title);
            formData.append('environment', state.environment);
            // Notice: isPublished is intentionally missing to remain 'false' initially

            const result = await createExhibitionAction(formData);
            if (!result.ok) throw new Error(result.error);

            dispatch({ type: 'CREATED', exhibitionId: result.exhibitionId });
        } catch (error: unknown) {
            console.error(error);
            alert(`Fehler beim Erstellen der Ausstellung: ${getErrorMessage(error, "Unbekannter Fehler")}`);
        } finally {
            setIsCreating(false);
        }
    };

    const stepVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <div className="flex min-h-[450px] w-full flex-col items-center justify-center">
            <AnimatePresence mode="wait">

                {state.step === 'welcome' && (
                    <motion.div key="welcome" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-2xl text-center">
                        <div className="relative mx-auto mb-10 h-32 w-32">
                            <style>{`
                @keyframes spin3d { 100% { transform: rotateY(360deg) rotateX(360deg); } }
                @keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } }
                .preserve-3d { transform-style: preserve-3d; }
              `}</style>
                            <div className="preserve-3d absolute inset-0 animate-[spin3d_12s_linear_infinite]">
                                <div className="absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 border border-[#00aaff] bg-[#00aaff]/20 backdrop-blur-sm animate-[float_3s_ease-in-out_infinite]" style={{ transform: 'translate3d(30px, -20px, 40px) rotateX(45deg) rotateY(45deg)' }} />
                                <div className="absolute left-1/2 top-1/2 -ml-8 -mt-8 h-16 w-16 border border-[#ff6b6b] bg-[#ff6b6b]/20 backdrop-blur-sm animate-[float_4s_ease-in-out_infinite_0.5s]" style={{ transform: 'translate3d(-40px, 20px, -30px) rotateX(30deg) rotateZ(20deg)' }} />
                                <div className="absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10 border border-[#ffd93d] bg-[#ffd93d]/20 backdrop-blur-sm animate-[float_3.5s_ease-in-out_infinite_1s]" style={{ transform: 'translate3d(10px, 40px, 50px) rotateY(60deg) rotateZ(45deg)' }} />
                            </div>
                        </div>
                        <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl">Willkommen bei 3D-Snap</h1>
                        <p className="mb-10 text-lg text-gray-400">In unter 15 Minuten haben Sie Ihren ersten interaktiven 3D-Showroom eingebunden.</p>
                        <div className="flex flex-col items-center gap-4">
                            <button autoFocus onClick={() => dispatch({ type: 'START' })} className="rounded-xl bg-[#00aaff] px-10 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(0,170,255,0.4)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                                Los geht&apos;s
                            </button>
                            <button onClick={onDismiss} className="text-sm font-medium text-white/40 transition-colors hover:text-white">Überspringen</button>
                        </div>
                    </motion.div>
                )}

                {state.step === 'choose_path' && (
                    <motion.div key="choose_path" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-4xl">
                        <h2 className="mb-10 text-center text-3xl font-bold text-white">Wie möchten Sie starten?</h2>
                        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                            {[
                                { id: 'photo', icon: Camera, title: 'Foto hochladen', desc: 'Laden Sie ein Produktfoto hoch — unsere KI macht den Rest.', badge: '⚡ KI-powered' },
                                { id: 'upload', icon: Box, title: 'GLB-Datei', desc: 'Sie haben bereits ein 3D-Modell? Laden Sie es direkt hoch.', badge: '🔄 Sofort' },
                                { id: 'demo', icon: Play, title: 'Demo testen', desc: 'Starten Sie mit einem Beispiel-Modell und erkunden den Editor.', badge: '✨ In 10 Sek.' }
                            ].map((item, i) => {
                                const isSelected = state.selectedPath === item.id;
                                return (
                                    <button
                                        key={item.id} autoFocus={i === 0}
                                        onClick={() => dispatch({ type: 'SELECT_PATH', path: item.id as PathType })}
                                        className={`group relative flex flex-col items-start rounded-2xl border-2 p-6 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aaff]
                      ${isSelected ? 'scale-[1.03] border-[#00aaff] bg-[#00aaff]/10 shadow-[0_0_20px_rgba(0,170,255,0.2)]' : 'border-white/10 bg-white/5 hover:scale-[1.02] hover:border-white/30'}
                    `}
                                    >
                                        {isSelected && <div className="absolute right-4 top-4 rounded-full bg-[#00aaff] p-1 text-white"><Check size={16} /></div>}
                                        <div className="mb-4 text-[#00aaff]"><item.icon size={36} /></div>
                                        <h3 className="mb-2 text-xl font-bold text-white">{item.title}</h3>
                                        <p className="mb-6 flex-1 text-sm text-gray-400">{item.desc}</p>
                                        <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-gray-300">{item.badge}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-6">
                            <button onClick={() => dispatch({ type: 'BACK' })} className="px-6 py-3 font-medium text-gray-400 transition-colors hover:text-white">Zurück</button>
                            <button onClick={() => dispatch({ type: 'CONFIGURE', title: 'Meine erste Ausstellung', environment: 'studio' })} disabled={!state.selectedPath} className="rounded-lg bg-[#00aaff] px-8 py-3 font-bold text-white shadow-[0_0_15px_rgba(0,170,255,0.4)] transition-transform disabled:opacity-50 disabled:shadow-none hover:scale-105">
                                Weiter
                            </button>
                        </div>
                    </motion.div>
                )}

                {state.step === 'configure' && (
                    <motion.div key="configure" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-4xl">
                        <h2 className="mb-8 text-3xl font-bold text-white">Details festlegen</h2>
                        <div className="mb-10 flex flex-col gap-12 md:flex-row">
                            <div className="flex-1 space-y-8">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-400">Titel der Ausstellung</label>
                                    <input autoFocus type="text" value={state.title} onChange={(e) => dispatch({ type: 'CONFIGURE', title: e.target.value, environment: state.environment })} className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white transition-all focus:border-[#00aaff] focus:outline-none focus:ring-1 focus:ring-[#00aaff]" />
                                </div>
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-gray-400">Umgebung wählen</label>
                                    <EnvironmentPicker selected={state.environment} onSelect={(env) => dispatch({ type: 'CONFIGURE', title: state.title, environment: env })} />
                                </div>
                            </div>
                            <div className="flex w-full flex-col md:w-72">
                                <label className="mb-3 block text-sm font-medium text-gray-400">Vorschau</label>
                                <div className={`relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] md:aspect-square bg-gradient-to-br ${ENVIRONMENTS.find(e => e.id === state.environment)?.gradient}`}>
                                    <div className="flex h-24 w-32 flex-col items-center justify-center rounded-lg border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
                                        <Box className="mb-2 h-8 w-8 text-white/60" />
                                        <div className="h-2 w-16 rounded-full bg-white/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-6">
                            <button onClick={() => dispatch({ type: 'BACK' })} className="px-6 py-3 font-medium text-gray-400 transition-colors hover:text-white">Zurück</button>
                            <button onClick={handleCreate} disabled={!state.title.trim() || isCreating} className="rounded-lg bg-[#00aaff] px-8 py-3 font-bold text-white shadow-[0_0_15px_rgba(0,170,255,0.4)] transition-transform disabled:opacity-50 hover:scale-105 flex items-center gap-2">
                                {isCreating && <Loader2 size={16} className="animate-spin" />}
                                Ausstellung erstellen
                            </button>
                        </div>
                    </motion.div>
                )}

                {state.step === 'processing' && (
                    <ProcessingStep
                        key="processing"
                        path={state.path}
                        exhibitionId={state.exhibitionId}
                        tenantId={tenantId}
                        title={state.title}
                        environment={state.environment}
                        onComplete={(glbUrl) => dispatch({ type: 'PROCESSING_DONE', glbUrl })}
                    />
                )}

                {state.step === 'checklist' && (
                    <ChecklistStep
                        key="checklist"
                        exhibitionId={state.exhibitionId}
                        title={state.title}
                        environment={state.environment}
                        glbUrl={state.glbUrl}
                        onDismiss={onDismiss}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Processing & Upload Helper ---
function ProcessingStep({ path, exhibitionId, tenantId, title, environment, onComplete }: { path: PathType; exhibitionId: string; tenantId: string; title: string; environment: string; onComplete: (glbUrl: string) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!file) return;

        let isCancelled = false;

        const processFile = async () => {
            try {
                if (path === 'upload') {
                    setStatusText("Lade Modell hoch...");
                    const downloadUrl = await uploadGlbFile(tenantId, file, (p) => {
                        if (!isCancelled) setProgress(p);
                    });

                    if (isCancelled) return;
                    setStatusText("Speichere Modell in Ausstellung...");

                    const fd = new FormData();
                    fd.append("exhibitionId", exhibitionId);
                    fd.append("title", title);
                    fd.append("environment", environment);
                    fd.append("glbUrl", downloadUrl);
                    // Do NOT set isPublished yet, as checklist will do it
                    await updateExhibitionAction(fd);

                    if (!isCancelled) {
                        setProgress(100);
                        onComplete(downloadUrl);
                    }
                } else if (path === 'photo') {
                    setStatusText("Lade Foto hoch und starte KI...");
                    const fd = new FormData();
                    fd.append("image", file);
                    const generateResult = await submitImage(fd);
                    if (!generateResult.taskId) throw new Error("Keine Task ID erhalten");

                    if (isCancelled) return;

                    // Polling via checkStatus
                    let isDone = false;
                    let finalGlbUrl = "";
                    while (!isDone && !isCancelled) {
                        await new Promise(r => setTimeout(r, 3000));
                        if (isCancelled) break;

                        const stat = await checkStatus(generateResult.taskId);
                        if (stat.status === 'FAILED') throw new Error("Generierung fehlgeschlagen");

                        setProgress(stat.progress || 10);
                        setStatusText(`Generiere 3D-Modell... ${stat.progress || 0}%`);

                        if (stat.status === 'SUCCEEDED') {
                            isDone = true;
                            const final = await finalizeModel(generateResult.taskId, tenantId, exhibitionId);
                            finalGlbUrl = final.glbUrl;
                        }
                    }

                    if (!isCancelled) {
                        setProgress(100);
                        setStatusText("Fertig!");
                        onComplete(finalGlbUrl);
                    }
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    setError(
                        getErrorMessage(err, "Ein Fehler ist aufgetreten. Bitte versuche es erneut."),
                    );
                }
            }
        };

        processFile();

        return () => { isCancelled = true; };
    }, [file, path, exhibitionId, tenantId, title, environment, onComplete]);

    if (!file) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mx-auto flex w-full max-w-xl flex-col items-center py-10">
                <h3 className="mb-6 text-2xl font-bold text-white">{path === 'photo' ? 'Produktfoto hochladen' : 'GLB-Datei hochladen'}</h3>
                {error && <div className="mb-4 text-red-500 font-medium">{error}</div>}
                <label
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') (e.currentTarget.querySelector('input') as HTMLInputElement)?.click() }}
                    className="flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-16 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aaff] hover:border-[#00aaff]"
                >
                    <UploadCloud className="mb-6 h-16 w-16 text-[#00aaff]" />
                    <span className="mb-2 text-lg font-medium text-white">Klicken oder Drag &amp; Drop</span>
                    <span className="text-gray-500">{path === 'photo' ? 'JPEG, PNG (Max 10MB)' : '.glb (Max 50MB)'}</span>
                    <input type="file" className="sr-only" accept={path === 'photo' ? 'image/*' : '.glb'} onChange={e => setFile(e.target.files?.[0] || null)} />
                </label>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mx-auto flex w-full max-w-md flex-col items-center py-20 text-center">
            {error ? (
                <div className="text-red-500 mb-4 font-bold">{error}</div>
            ) : (
                <>
                    {path === 'photo' ? (
                        <div className="relative mb-8 h-24 w-24">
                            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                            <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#00aaff] border-t-transparent" />
                        </div>
                    ) : (
                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <Box className="h-10 w-10 animate-bounce text-[#00aaff]" />
                        </div>
                    )}

                    <h3 className="mb-3 text-2xl font-bold text-white">{statusText || "Wird verarbeitet..."}</h3>
                    {path === 'photo' && <p className="mb-8 text-sm text-[#00aaff] animate-pulse">KI-Generierung benötigt meist ~2-4 Minuten.</p>}

                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 mt-4">
                        <motion.div className="h-full bg-[#00aaff] shadow-[0_0_10px_rgba(0,170,255,0.5)] transition-all" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-4 text-sm font-medium text-gray-400">{Math.round(progress)}%</div>
                </>
            )}
        </motion.div>
    );
}

// --- Checklist & Inline Preview Helper ---
function ChecklistStep({ exhibitionId, title, environment, glbUrl, onDismiss }: { exhibitionId: string; title: string; environment: string; glbUrl: string; onDismiss: () => void }) {
    const [published, setPublished] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [copied, setCopied] = useState(false);

    // Default Fallback für Server-Side Rendering (origin not available)
    const [embedUrl, setEmbedUrl] = useState('');

    useEffect(() => {
        setEmbedUrl(`${window.location.origin}/embed/${exhibitionId}`);
    }, [exhibitionId]);

    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const fd = new FormData();
            fd.append("exhibitionId", exhibitionId);
            fd.append("title", title);
            fd.append("environment", environment);
            fd.append("glbUrl", glbUrl || ""); // pass it down to prevent deletion
            fd.append("isPublished", "on"); // Sets it to published
            await updateExhibitionAction(fd);
            setPublished(true);
        } catch (e: unknown) {
            console.error(e);
            alert("Fehler beim Veröffentlichen");
        } finally {
            setPublishing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
    };

    return (
        <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative mx-auto w-full max-w-2xl py-8 text-left max-h-[85vh] overflow-y-auto hide-scrollbar">
            {published && copied && <ConfettiExplosion />}
            <h2 className="mb-8 text-3xl font-bold text-white text-center">Fast fertig! First-Win Checklist 🎉</h2>

            <div className="space-y-4 mb-8">
                {/* Step 1: Model */}
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                        <Check size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-white">1. 3D-Modell bereit</h4>
                        <p className="text-sm text-gray-400">Dein Modell wurde erfolgreich verarbeitet.</p>
                    </div>
                </div>

                {/* Step 2: Publish */}
                <div className={`flex items-center gap-4 bg-white/5 border ${published ? 'border-green-500/50' : 'border-white/10'} p-4 rounded-xl transition-colors`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${published ? 'bg-green-500/20 text-green-500' : 'bg-[#00aaff]/20 text-[#00aaff]'}`}>
                        {published ? <Check size={20} /> : <span className="font-bold">2</span>}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-white">2. Ausstellung veröffentlichen</h4>
                        <p className="text-sm text-gray-400">Damit das Embed funktioniert, muss die Ausstellung öffentlich sein.</p>
                    </div>
                    {!published ? (
                        <button onClick={handlePublish} disabled={publishing} className="rounded-lg bg-[#00aaff] px-6 py-2 font-bold text-white shadow-[0_0_15px_rgba(0,170,255,0.4)] transition-transform hover:scale-105 disabled:opacity-50 flex items-center gap-2">
                            {publishing && <Loader2 size={16} className="animate-spin" />} Jetzt veröffentlichen
                        </button>
                    ) : (
                        <span className="text-green-500 font-bold px-4">Erledigt</span>
                    )}
                </div>

                {/* Step 3: Embed Copy */}
                <div className={`flex items-center gap-4 bg-white/5 border ${copied ? 'border-green-500/50' : 'border-white/10'} p-4 rounded-xl transition-colors opacity-${published ? '100' : '50'}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${copied ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white'}`}>
                        {copied ? <Check size={20} /> : <span className="font-bold">3</span>}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-white">3. Embed Code kopieren</h4>
                        <p className="text-sm text-gray-400">Kopiere diesen Code für deine Website.</p>
                        {published && embedUrl && (
                            <code className="block mt-2 font-mono text-xs text-[#00aaff] truncate w-[250px] sm:w-[350px]">{embedCode}</code>
                        )}
                    </div>
                    {published && !copied ? (
                        <button onClick={handleCopy} className="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20 flex items-center gap-2 whitespace-nowrap">
                            <Copy size={16} /> Code kopieren
                        </button>
                    ) : copied ? (
                        <span className="text-green-500 font-bold px-4">Kopiert!</span>
                    ) : null}
                </div>
            </div>

            {/* Step 4: Inline Live Preview */}
            <AnimatePresence>
                {copied && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden mb-8">
                        <h4 className="font-bold text-white mb-2">4. Live-Test (Vorschau)</h4>
                        <p className="text-sm text-gray-400 mb-4">So sieht dein 3D-Showroom eingebettet aus:</p>
                        <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                            <iframe src={`/embed/${exhibitionId}`} width="100%" height="100%" frameBorder="0" className="w-full h-full"></iframe>
                        </div>
                        <div className="mt-6 flex justify-center gap-4">
                            <Link href={`/dashboard/editor/${exhibitionId}`} onClick={onDismiss} className="flex flex-1 max-w-sm items-center justify-center gap-2 rounded-xl bg-[#00aaff] px-8 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(0,170,255,0.4)] transition-all hover:scale-105">
                                <Edit2 size={18} /> Weiter zum Editor
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Concierge CTA */}
            <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-gray-400 mb-3">Keine Zeit, das alles selbst einzurichten?</p>
                <a href="mailto:support@3d-snap.com?subject=Concierge%20Service%20Anfrage" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:border-white/30">
                    <Mail size={16} /> Wir richten es für dich ein (Concierge Service)
                </a>
            </div>

        </motion.div>
    );
}

// --- Dashboard Wrapper Integration ---
export function OnboardingWrapper({ tenantId }: { tenantId: string }) {
    const { shouldShowOnboarding, dismissOnboarding } = useOnboardingStatus(0);

    if (!shouldShowOnboarding) {
        return (
            <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-20 text-center">
                <Box className="mb-6 h-16 w-16 text-gray-600" />
                <h2 className="mb-2 text-2xl font-bold text-white">Keine Ausstellungen vorhanden</h2>
                <p className="mb-8 max-w-md text-gray-400">Sie haben noch keine 3D-Showrooms erstellt. Starten Sie jetzt und laden Sie Ihr erstes Modell hoch.</p>
                <Link href="/dashboard/exhibitions/new" className="rounded-lg bg-[#00aaff] px-6 py-3 font-medium text-white transition-transform hover:scale-105">
                    Neue Ausstellung erstellen
                </Link>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md sm:p-6">
            <div className="my-auto flex min-h-[500px] w-full max-w-5xl flex-col justify-center rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-12">
                <OnboardingFlow tenantId={tenantId} onDismiss={dismissOnboarding} />
            </div>
        </div>
    );
}
