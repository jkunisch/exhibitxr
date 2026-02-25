'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Layers, Globe, Eye, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface DashboardStats {
    total: number;
    published: number;
    views: number;
    avgSession: number;
    trends: {
        total: number;
        published: number;
        views: number;
        avgSession: number;
    };
}

interface StatsGridProps {
    stats: DashboardStats;
}

function AnimatedCounter({ value, isK = false, suffix = '' }: { value: number; isK?: boolean; suffix?: string }) {
    const spring = useSpring(0, { bounce: 0, duration: 1500 });
    const display = useTransform(spring, (current) => {
        const val = Math.round(current);
        if (isK && val >= 1000) {
            return (val / 1000).toFixed(1) + 'k' + suffix;
        }
        return val.toString() + suffix;
    });

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
}

export function StatsGrid({ stats }: StatsGridProps) {
    const cards = [
        {
            title: 'Exhibitions',
            value: stats.total,
            icon: Layers,
            trend: stats.trends.total,
            trendText: `+${stats.trends.total} this mo`,
            isPositive: stats.trends.total >= 0,
            color: 'text-[#00aaff]',
        },
        {
            title: 'Published',
            value: stats.published,
            icon: Globe,
            trend: stats.trends.published,
            trendText: `${stats.trends.published}% rate`,
            isPositive: true,
            color: 'text-emerald-400',
        },
        {
            title: 'Views (30d)',
            value: stats.views,
            icon: Eye,
            trend: stats.trends.views,
            trendText: `${stats.trends.views >= 0 ? '+' : ''}${stats.trends.views}% ↑`,
            isPositive: stats.trends.views >= 0,
            color: 'text-purple-400',
            isK: true,
        },
        {
            title: 'Avg. Session',
            value: stats.avgSession,
            icon: Clock,
            trend: stats.trends.avgSession,
            trendText: `${stats.trends.avgSession >= 0 ? '+' : ''}${stats.trends.avgSession}% ${stats.trends.avgSession >= 0 ? '↑' : '↓'}`,
            isPositive: stats.trends.avgSession >= 0,
            color: 'text-amber-400',
            suffix: 's',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, i) => {
                const TrendIcon = card.isPositive ? ArrowUpRight : ArrowDownRight;
                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.06] transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                                <card.icon className={`w-5 h-5 ${card.color}`} strokeWidth={2} />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${card.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                <TrendIcon className="w-4 h-4" />
                                <span>{card.trendText}</span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-white/60 text-sm font-medium mb-1">{card.title}</h3>
                            <div className="text-3xl font-semibold text-white tracking-tight flex items-baseline">
                                <AnimatedCounter value={card.value} isK={card.isK} suffix={card.suffix} />
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.div>
                );
            })}
        </div>
    );
}
