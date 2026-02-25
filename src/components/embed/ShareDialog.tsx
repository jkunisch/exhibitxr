"use client";

import { useState } from "react";
import { X, Link as LinkIcon, Mail, Twitter, Linkedin, Check, Copy } from "lucide-react";

interface EmbedOptions {
    autoRotate?: boolean;
    hideUI?: boolean;
    bgColor?: string;
    width?: string;
    height?: string;
}

interface ShareDialogProps {
    exhibitId: string;
    title: string;
    onClose: () => void;
    options?: EmbedOptions;
}

function buildEmbedCode(id: string, options: EmbedOptions): string {
    const params = new URLSearchParams();
    if (options.autoRotate) params.set("autoRotate", "1");
    if (options.hideUI) params.set("hideUI", "1");
    if (options.bgColor) params.set("bg", options.bgColor.replace("#", ""));

    const query = params.toString() ? `?${params.toString()}` : "";

    return `<iframe
  src="https://3d-snap.com/embed/${id}${query}"
  width="${options.width || "100%"}"
  height="${options.height || "600px"}"
  frameborder="0"
  allow="xr-spatial-tracking; fullscreen"
  loading="lazy"
  style="border: none; border-radius: 12px;"
></iframe>`;
}

export function ShareDialog({ exhibitId, title, onClose, options = {} }: ShareDialogProps) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);

    const directUrl = `https://3d-snap.com/embed/${exhibitId}`;
    const embedCode = buildEmbedCode(exhibitId, options);

    const handleCopy = async (text: string, setCopied: (val: boolean) => void) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const el = document.createElement("textarea");
                el.value = text;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Fallback copy failed", err);
        }
    };

    const shareLinks = {
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(directUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(directUrl)}&text=${encodeURIComponent(`Checkout this 3D model: ${title}`)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(directUrl)}`,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 pointer-events-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl relative">
                <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white">Teilen</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex justify-between sm:justify-center sm:gap-6 mb-8">
                        <button
                            onClick={() => handleCopy(directUrl, setCopiedLink)}
                            className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner hover:bg-zinc-700 transition-colors">
                                <LinkIcon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">Link</span>
                        </button>
                        <a
                            href={shareLinks.email}
                            className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner hover:bg-zinc-700 transition-colors">
                                <Mail className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">Mail</span>
                        </a>
                        <a
                            href={shareLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner hover:bg-zinc-700 transition-colors">
                                <Twitter className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">X</span>
                        </a>
                        <a
                            href={shareLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner hover:bg-zinc-700 transition-colors">
                                <Linkedin className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">LinkedIn</span>
                        </a>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-zinc-400 mb-2 block">Embed-Code:</label>
                            <div className="flex bg-black rounded-xl p-1.5 border border-zinc-800">
                                <input
                                    readOnly
                                    value={embedCode}
                                    className="bg-transparent text-sm text-zinc-300 w-full px-3 outline-none font-mono truncate"
                                />
                                <button
                                    onClick={() => handleCopy(embedCode, setCopiedEmbed)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center gap-2"
                                >
                                    {copiedEmbed ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{copiedEmbed ? 'Kopiert' : 'Kopieren'}</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-zinc-400 mb-2 block">Direktlink:</label>
                            <div className="flex bg-black rounded-xl p-1.5 border border-zinc-800">
                                <input
                                    readOnly
                                    value={directUrl}
                                    className="bg-transparent text-sm text-zinc-300 w-full px-3 outline-none truncate"
                                />
                                <button
                                    onClick={() => handleCopy(directUrl, setCopiedLink)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center gap-2"
                                >
                                    {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{copiedLink ? 'Kopiert' : 'Kopieren'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
