"use client";

import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { create } from "zustand";
import { Download, Share2, X } from "lucide-react";
import * as THREE from "three";

// ─── Shared store for screenshot state ───────────────────────────────────────
interface ScreenshotStore {
    /** The WebGL renderer reference (set by ScreenshotGatherer inside Canvas). */
    glRef: THREE.WebGLRenderer | null;
    setGlRef: (gl: THREE.WebGLRenderer | null) => void;
}

export const useScreenshotStore = create<ScreenshotStore>((set) => ({
    glRef: null,
    setGlRef: (glRef) => set({ glRef }),
}));

/**
 * R3F component — MUST live INSIDE the <Canvas>.
 *
 * Captures the WebGL renderer reference and stores it in Zustand
 * so the DOM-based ScreenshotUI can use it.
 */
export function ScreenshotGatherer() {
    const { gl } = useThree();
    const setGlRef = useScreenshotStore((s) => s.setGlRef);

    useEffect(() => {
        setGlRef(gl);
        return () => setGlRef(null);
    }, [gl, setGlRef]);

    return null;
}

/**
 * DOM component — MUST live OUTSIDE the <Canvas>.
 *
 * Listens for the `3dsnap:screenshot` event, captures the canvas,
 * and shows a preview modal with download/share options.
 */
export function ScreenshotCaptureUI({ title }: { title: string }) {
    const glRef = useScreenshotStore((s) => s.glRef);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);

    const captureFrame = useCallback(async (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            try {
                if (!glRef) {
                    reject(new Error("No WebGL renderer available"));
                    return;
                }
                const dataUrl = glRef.domElement.toDataURL("image/png");
                const byteString = atob(dataUrl.split(",")[1]);
                const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];

                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                resolve(new Blob([ab], { type: mimeString }));
            } catch (error) {
                reject(error);
            }
        });
    }, [glRef]);

    const handleCapture = useCallback(async () => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 100);

        try {
            const capturedBlob = await captureFrame();
            setBlob(capturedBlob);
            setPreviewUrl(URL.createObjectURL(capturedBlob));
        } catch (err) {
            console.error("Screenshot capture failed:", err);
        }
    }, [captureFrame]);

    useEffect(() => {
        window.addEventListener("3dsnap:screenshot", handleCapture);
        return () => window.removeEventListener("3dsnap:screenshot", handleCapture);
    }, [handleCapture]);

    const handleClose = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setBlob(null);
    };

    const downloadName = `3dsnap-${title.toLowerCase().replace(/\s+/g, "-")}-screenshot.png`;

    const handleDownload = () => {
        if (!previewUrl) return;
        const a = document.createElement("a");
        a.href = previewUrl;
        a.download = downloadName;
        a.click();
    };

    const handleShare = async () => {
        if (!blob) return;
        const file = new File([blob], downloadName, { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `${title} - Screenshot`,
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            try {
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);
                alert("Bild in die Zwischenablage kopiert!");
            } catch {
                handleDownload();
            }
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-[60] bg-white pointer-events-none transition-opacity duration-100 ${isFlashing ? "opacity-30" : "opacity-0"
                    }`}
            />

            {previewUrl && blob && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h3 className="text-white font-medium">Screenshot Preview</h3>
                            <button
                                onClick={handleClose}
                                className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-black/50 p-4 flex items-center justify-center min-h-[30vh]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewUrl}
                                alt="3D Screenshot"
                                className="max-w-full max-h-[45vh] object-contain rounded-xl ring-1 ring-white/10"
                            />
                        </div>

                        <div className="p-4 border-t border-zinc-800 flex flex-wrap gap-3 justify-end">
                            <button
                                onClick={handleDownload}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors min-h-[44px] flex-1 sm:flex-none"
                            >
                                <Download className="w-5 h-5" /> Download
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors min-h-[44px] flex-1 sm:flex-none"
                            >
                                <Share2 className="w-5 h-5" /> Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
