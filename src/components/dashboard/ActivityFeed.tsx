'use client';

import { motion, AnimatePresence } from 'framer-motion';

export type ActivityType = 'edited' | 'published' | 'created' | 'model_generated' | 'viewed';

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    timestamp: number;
    exhibitionId: string;
}

interface ActivityFeedProps {
    activities: Activity[];
}

const EMOJIS: Record<ActivityType, string> = {
    edited: '🎨',
    published: '📤',
    created: '🆕',
    model_generated: '🤖',
    viewed: '👁️',
};

const ACTION_TEXT: Record<ActivityType, string> = {
    edited: 'bearbeitet',
    published: 'veröffentlicht',
    created: 'erstellt',
    model_generated: 'generiert (KI)',
    viewed: 'angesehen',
};

function formatTime(ts: number) {
    return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-sm font-semibold text-white/80 tracking-wider mb-6 pb-4 border-b border-white/[0.08] uppercase">
                Letzte Aktivitäten
            </h3>

            <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.08]" />

                <ul className="space-y-6">
                    <AnimatePresence>
                        {activities.slice(0, 10).map((activity, i) => (
                            <motion.li
                                key={activity.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                className="relative flex items-start gap-4"
                            >
                                <div className="relative z-10 w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 rounded-full bg-[#0a0a0f] ring-4 ring-[#0a0a0f]">
                                    <span className="text-sm leading-none">{EMOJIS[activity.type]}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-white/40 font-mono mb-0.5">
                                        {formatTime(activity.timestamp)}
                                    </span>
                                    <div className="text-sm text-white/60 leading-tight">
                                        {activity.type === 'created' ? (
                                            <>Neue Ausstellung <span className="font-medium text-white/90">&quot;{activity.title}&quot;</span> erstellt</>
                                        ) : activity.type === 'model_generated' ? (
                                            <>3D-Modell generiert <span className="font-medium text-white/90">({activity.title})</span></>
                                        ) : (
                                            <>
                                                <span className="font-medium text-white/90">{activity.title}</span>{' '}
                                                {ACTION_TEXT[activity.type]}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>

                {activities.length === 0 && (
                    <p className="text-sm text-white/40 py-4">Keine Aktivitäten vorhanden.</p>
                )}
            </div>
        </div>
    );
}
