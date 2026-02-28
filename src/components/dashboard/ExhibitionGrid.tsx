'use client';

import { memo, useState, useCallback, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Code2, ExternalLink, Box, Sun, Building2, Sunset, Warehouse, Trash2, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/components/ui/Toast';
import { deleteExhibitionAction } from '@/app/actions/exhibitions';

export interface ExhibitionClientData {
    id: string;
    title: string;
    environment: string;
    variantsCount: number;
    hotspotsCount: number;
    updatedAt: number;
    isPublished: boolean;
    /** URL of a poster/thumbnail image for this exhibition (auto-generated on 3D creation). */
    thumbnailUrl?: string;
}

const ENV_GRADIENTS: Record<string, string> = {
    studio: 'from-slate-800 via-slate-600 to-slate-900',
    city: 'from-sky-900 via-blue-800 to-slate-900',
    sunset: 'from-orange-900 via-rose-800 to-purple-900',
    warehouse: 'from-amber-900 via-stone-800 to-zinc-900',
    default: 'from-zinc-800 via-zinc-700 to-zinc-900',
};

const ENV_ICONS: Record<string, LucideIcon> = {
    studio: Sun,
    city: Building2,
    sunset: Sunset,
    warehouse: Warehouse,
    default: Box,
};

const ExhibitionCard = memo(({ exhibition, tenantId }: { exhibition: ExhibitionClientData; tenantId: string }) => {
    const { showToast } = useToastStore();
    const router = useRouter();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, startDeleteTransition] = useTransition();

    const env = exhibition.environment?.toLowerCase() || 'studio';
    const gradient = ENV_GRADIENTS[env] || ENV_GRADIENTS.default;
    const EnvIcon = ENV_ICONS[env] || ENV_ICONS.default;

    const handleEmbed = () => {
        const code = `<iframe src="https://3d-snap.com/embed/${exhibition.id}" width="100%" height="600" frameborder="0" allow="xr-spatial-tracking" allowfullscreen></iframe>`;
        navigator.clipboard.writeText(code);
        showToast('Embed-Code kopiert! ✓');
    };

    const formattedDate = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(exhibition.updatedAt));

    return (
        <div className="group flex flex-col bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(0,170,255,0.08)] h-full">
            <div className={`relative h-44 w-full bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 bg-[#0a0a0f]/20 mix-blend-overlay" />
                {exhibition.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={exhibition.thumbnailUrl}
                        alt={exhibition.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    />
                ) : (
                    <EnvIcon className="w-12 h-12 text-white/30 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:text-white/50" strokeWidth={1.5} />
                )}
            </div>

            <div className="flex flex-col flex-1 p-5">
                <h3 className="text-lg font-medium text-white mb-1 truncate" title={exhibition.title}>
                    {exhibition.title || 'Untitled Exhibition'}
                </h3>
                <p className="text-sm text-white/50 mb-6 font-medium capitalize">
                    {env} • {exhibition.variantsCount} variant{exhibition.variantsCount !== 1 ? 's' : ''} • {exhibition.hotspotsCount} hotspot{exhibition.hotspotsCount !== 1 ? 's' : ''}
                </p>

                <div className="grid grid-cols-4 gap-2 mt-auto">
                    <Link
                        href={`/dashboard/editor/${exhibition.id}`}
                        aria-label="Edit Exhibition"
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aaff]"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </Link>
                    <button
                        onClick={handleEmbed}
                        aria-label="Copy Embed Code"
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aaff] cursor-pointer"
                    >
                        <Code2 className="w-4 h-4" />
                        Embed
                    </button>
                    <a
                        href={`/embed/${exhibition.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Preview Exhibition"
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aaff]"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Share
                    </a>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        aria-label="Delete Exhibition"
                        className="flex items-center justify-center py-2.5 bg-red-500/5 hover:bg-red-500/15 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {showDeleteConfirm && (
                    <div className="mt-3 flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 animate-in fade-in zoom-in duration-200">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">
                            Löschen?
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => {
                                    startDeleteTransition(async () => {
                                        const fd = new FormData();
                                        fd.set('exhibitionId', exhibition.id);
                                        fd.set('tenantId', tenantId);
                                        const result = await deleteExhibitionAction(fd);
                                        if (result.ok) {
                                            showToast('Gelöscht ✓');
                                            router.refresh();
                                        } else {
                                            showToast(`Fehler: ${result.error}`);
                                        }
                                        setShowDeleteConfirm(false);
                                    });
                                }}
                                className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-105 disabled:opacity-50"
                            >
                                {isDeleting ? '...' : 'Ja'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Nein
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-white/40 font-medium">Updated: {formattedDate}</span>
                <div className="flex items-center gap-1.5 font-medium">
                    <span className={`w-2 h-2 rounded-full ${exhibition.isPublished ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
                    <span className={exhibition.isPublished ? 'text-white/80' : 'text-white/40'}>
                        {exhibition.isPublished ? 'Published' : 'Draft'}
                    </span>
                </div>
            </div>
        </div>
    );
});

ExhibitionCard.displayName = 'ExhibitionCard';

export function ExhibitionGrid({ exhibitions, tenantId }: { exhibitions: ExhibitionClientData[]; tenantId: string }) {
    if (exhibitions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] border border-white/[0.08] border-dashed rounded-2xl text-center">
                <Box className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Keine Ausstellungen</h3>
                <p className="text-sm text-white/50 max-w-sm">
                    Erstelle deine erste interaktive 3D-Ausstellung, um deine Produkte zu präsentieren.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 content-start">
            {exhibitions.map((ex, i) => (
                <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                    <ExhibitionCard exhibition={ex} tenantId={tenantId} />
                </motion.div>
            ))}
        </div>
    );
}
