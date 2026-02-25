'use client';

import { useState, useEffect } from 'react';
import { Plus, Camera } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
    userName: string;
    stats: {
        active: number;
        published: number;
    };
}

export function DashboardHeader({ userName, stats }: DashboardHeaderProps) {
    const [greeting, setGreeting] = useState('Guten Tag');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 12) setGreeting('Guten Morgen');
            else if (hour >= 12 && hour < 18) setGreeting('Guten Tag');
            else if (hour >= 18 && hour < 22) setGreeting('Guten Abend');
            else setGreeting('Gute Nacht');
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 pt-4">
            <div>
                <h1 className="text-3xl font-semibold text-white tracking-tight mb-2 flex items-center gap-2">
                    {mounted ? greeting : 'Guten Tag'}, {userName}
                    <motion.span
                        className="inline-block origin-[70%_70%]"
                        animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                    >
                        👋
                    </motion.span>
                </h1>
                <p className="text-white/50 text-sm font-medium">
                    {stats.active} {stats.active === 1 ? 'Ausstellung' : 'Ausstellungen'} aktiv <span className="mx-1">•</span> {stats.published} veröffentlicht
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard/exhibitions/new"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aaff]"
                >
                    <Camera className="w-4 h-4 text-white/60" />
                    <span>📸 Foto → 3D</span>
                </Link>
                <Link
                    href="/dashboard/exhibitions/new"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00aaff] hover:bg-[#0099e6] rounded-xl text-sm font-medium text-white transition-all shadow-[0_0_20px_rgba(0,170,255,0.3)] hover:shadow-[0_0_25px_rgba(0,170,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <Plus className="w-4 h-4" />
                    <span>+ Neue Ausstellung</span>
                </Link>
            </div>
        </div>
    );
}
