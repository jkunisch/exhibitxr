"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Info } from "lucide-react";

interface EmbedOptions {
    width: string;
    height: string;
    autoRotate: boolean;
    hideUI: boolean;
    bgColor: string;
    showBranding: boolean;
}

interface EmbedBuilderProps {
    exhibitId: string;
    isProPlan?: boolean;
}

const PRESET_COLORS = ["#ffffff", "#f4f4f5", "#18181b", "#000000", "transparent"];

export function EmbedBuilder({ exhibitId, isProPlan = false }: EmbedBuilderProps) {
    const [options, setOptions] = useState<EmbedOptions>({
        width: "100%",
        height: "600px",
        autoRotate: false,
        hideUI: false,
        bgColor: "#ffffff",
        showBranding: true,
    });

    const [copied, setCopied] = useState(false);

    const getQueryString = (): string => {
        const params = new URLSearchParams();
        if (options.autoRotate) params.set("autoRotate", "1");
        if (options.hideUI) params.set("hideUI", "1");
        if (options.bgColor && options.bgColor !== "transparent") {
            params.set("bg", options.bgColor.replace("#", ""));
        }
        if (!options.showBranding) params.set("branding", "0");
        return params.toString() ? `?${params.toString()}` : "";
    };

    const embedCode = useMemo(() => {
        const directUrl = `https://exhibitxr.com/embed/${exhibitId}${getQueryString()}`;
        return `<iframe
  src="${directUrl}"
  width="${options.width || "100%"}"
  height="${options.height || "600px"}"
  frameborder="0"
  allow="xr-spatial-tracking; fullscreen"
  loading="lazy"
  style="border: none; border-radius: 12px;"
></iframe>`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exhibitId, options]);

    const previewUrl = useMemo(() => {
        return `/embed/${exhibitId}${getQueryString()}`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exhibitId, options]);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(embedCode);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = embedCode;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Embed-Code Generator</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Konfiguriere deinen interaktiven 3D-Player für deine Website.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
                {/* Settings Panel */}
                <div className="p-6 lg:col-span-5 xl:col-span-4 space-y-8 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Dimensionen</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Breite</label>
                                <input
                                    type="text"
                                    value={options.width}
                                    onChange={(e) => setOptions(prev => ({ ...prev, width: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow min-h-[44px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Höhe</label>
                                <input
                                    type="text"
                                    value={options.height}
                                    onChange={(e) => setOptions(prev => ({ ...prev, height: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow min-h-[44px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Darstellung</h4>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Hintergrundfarbe</label>
                            <div className="flex gap-3 items-center flex-wrap">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setOptions(prev => ({ ...prev, bgColor: color }))}
                                        className={`w-8 h-8 rounded-full border-2 ${options.bgColor === color ? "border-indigo-500 scale-110 shadow-md" : "border-zinc-200 dark:border-zinc-700 hover:scale-105"} transition-all`}
                                        style={{ background: color === "transparent" ? "repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 16px 16px" : color }}
                                        title={color === "transparent" ? "Transparent" : color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Features</h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${options.autoRotate ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"}`}>
                                    {options.autoRotate && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={options.autoRotate} onChange={(e) => setOptions(prev => ({ ...prev, autoRotate: e.target.checked }))} />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Auto-Rotation</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${options.hideUI ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"}`}>
                                    {options.hideUI && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={options.hideUI} onChange={(e) => setOptions(prev => ({ ...prev, hideUI: e.target.checked }))} />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">UI verstecken</span>
                            </label>

                            <label className={`flex items-center gap-3 min-h-[44px] ${!isProPlan ? "opacity-50 cursor-not-allowed" : "cursor-pointer group"}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${options.showBranding ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"}`}>
                                    {options.showBranding && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={options.showBranding}
                                    onChange={(e) => isProPlan && setOptions(prev => ({ ...prev, showBranding: e.target.checked }))}
                                    disabled={!isProPlan}
                                />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    Branding anzeigen
                                    {!isProPlan && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                                            Pro
                                        </span>
                                    )}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="p-6 lg:col-span-7 xl:col-span-8 flex flex-col bg-white dark:bg-zinc-900">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Live Preview</h4>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <Info className="w-4 h-4" />
                            <span>Maßstab verkleinert</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 relative shadow-inner">
                        <iframe
                            src={previewUrl}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="xr-spatial-tracking; fullscreen"
                        />
                    </div>
                </div>
            </div>

            {/* Code Export */}
            <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                <div className="flex-1 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto shadow-sm">
                    <pre className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                        {embedCode}
                    </pre>
                </div>
                <button
                    onClick={handleCopy}
                    className="xl:w-auto w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm min-h-[44px]"
                >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span>{copied ? "Code kopiert!" : "Code kopieren"}</span>
                </button>
            </div>
        </div>
    );
}
