"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { Maximize2, Minimize2, Box, Camera, Share2 } from "lucide-react";
import { ShareDialog } from "./ShareDialog";

interface EmbedChromeProps {
    containerRef: RefObject<HTMLDivElement | null>;
    title: string;
    tenantLogo?: string | null;
    exhibitId: string;
    showBranding?: boolean;
    hideUI?: boolean;
    variants?: string[];
    activeVariant?: string;
    onVariantChange?: (variant: string) => void;
}

export function EmbedChrome({
    containerRef,
    title,
    tenantLogo,
    exhibitId,
    showBranding = true,
    hideUI = false,
    variants = [],
    activeVariant,
    onVariantChange,
}: EmbedChromeProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [showArToast, setShowArToast] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (hideUI) return;

        const resetTimer = () => {
            setIsVisible(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setIsVisible(false), 3000);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("mousemove", resetTimer);
            container.addEventListener("touchstart", resetTimer, { passive: true });
            container.addEventListener("click", resetTimer);
            container.addEventListener("mouseleave", () => setIsVisible(false));
        }

        resetTimer();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (container) {
                container.removeEventListener("mousemove", resetTimer);
                container.removeEventListener("touchstart", resetTimer);
                container.removeEventListener("click", resetTimer);
                container.removeEventListener("mouseleave", () => setIsVisible(false));
            }
        };
    }, [containerRef, hideUI]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error);
        } else {
            containerRef.current?.requestFullscreen().catch(console.error);
        }
    };

    const handleScreenshot = () => {
        window.dispatchEvent(new CustomEvent("exhibitxr:screenshot"));
    };

    const handleArClick = () => {
        setShowArToast(true);
        setTimeout(() => setShowArToast(false), 3000);
    };

    if (hideUI) return null;

    return (
        <>
            <div
                className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-500 z-10 ${isVisible || isShareOpen ? "opacity-100" : "opacity-0"
                    }`}
            >
                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 sm:p-3 pointer-events-auto shadow-lg">
                        {tenantLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={tenantLogo} alt="Logo" className="h-6 sm:h-8 w-auto object-contain" />
                        ) : (
                            <div className="h-6 sm:h-8 flex items-center justify-center font-bold text-white tracking-wider px-2">
                                3D-Snap
                            </div>
                        )}
                        <div className="w-px h-6 bg-white/20" />
                        <h1 className="text-white font-medium text-sm sm:text-base px-1 truncate max-w-[150px] sm:max-w-xs">
                            {title}
                        </h1>
                    </div>

                    <button
                        onClick={toggleFullscreen}
                        className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl text-white hover:bg-black/60 transition-colors pointer-events-auto shadow-lg flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col items-end gap-3 pointer-events-none">
                    {showArToast && (
                        <div className="bg-black/80 backdrop-blur-md text-white text-sm px-4 py-2 rounded-xl shadow-lg pointer-events-auto border border-white/10">
                            AR Coming Soon
                        </div>
                    )}

                    <div className="flex justify-between items-end w-full">
                        <div className="flex flex-wrap gap-2 pointer-events-auto">
                            {variants.length > 0 && onVariantChange && (
                                <div className="flex gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto shadow-lg">
                                    {variants.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => onVariantChange(v)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${activeVariant === v ? 'bg-white text-black' : 'text-white hover:bg-white/20'
                                                }`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleArClick}
                                className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-2xl text-white text-sm font-medium transition-colors shadow-lg border border-white/10 min-w-[44px] min-h-[44px]"
                            >
                                <Box className="w-5 h-5" />
                                <span className="hidden sm:inline">AR</span>
                            </button>

                            <button
                                onClick={handleScreenshot}
                                className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-2xl text-white text-sm font-medium transition-colors shadow-lg border border-white/10 min-w-[44px] min-h-[44px]"
                            >
                                <Camera className="w-5 h-5" />
                                <span className="hidden sm:inline">Screenshot</span>
                            </button>

                            <button
                                onClick={() => setIsShareOpen(true)}
                                className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-2xl text-white text-sm font-medium transition-colors shadow-lg border border-white/10 min-w-[44px] min-h-[44px]"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="hidden sm:inline">Share</span>
                            </button>
                        </div>

                        {showBranding && (
                            <a
                                href="https://3d-snap.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/60 text-xs text-right hidden sm:block pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg hover:text-white transition-colors"
                            >
                                Powered by <br />
                                <span className="font-bold text-white/90">3D-Snap</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {isShareOpen && (
                <ShareDialog
                    exhibitId={exhibitId}
                    title={title}
                    onClose={() => setIsShareOpen(false)}
                />
            )}
        </>
    );
}
