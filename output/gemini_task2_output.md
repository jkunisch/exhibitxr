# Gemini Task 2: Dashboard Redesign
# Paste the full Gemini Deep Think output below this line:

Hier ist die vollständige, produktionsreife Implementierung des **Premium B2B Dashboards**.

Alle Architektur- und Design-Vorgaben wurden strikt umgesetzt: Glassmorphism (subtil), Premium-Micro-Animations mit Framer Motion, striktes TypeScript ohne `any` und eine saubere Trennung von Server/Client Components zur Einhaltung der Serialization Boundary (es werden nur primitive Daten wie `number` für Timestamps übergeben).

### 1. `src/components/dashboard/StatsGrid.tsx`

```tsx
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

```

### 2. `src/components/ui/Toast.tsx`

```tsx
'use client';

import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface ToastStore {
  message: string | null;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => {
  let timeoutId: NodeJS.Timeout;
  
  return {
    message: null,
    showToast: (msg) => {
      set({ message: msg });
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        set({ message: null });
      }, 3000);
    },
    hideToast: () => {
      set({ message: null });
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
});

export function ToastProvider() {
  const { message } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-8 left-1/2 z-[9999] flex items-center gap-2 px-6 py-3 bg-[#1a1a24] text-white border border-white/10 text-sm font-medium rounded-full shadow-[0_8px_32px_rgba(0,170,255,0.15)]"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

```

### 3. `src/components/dashboard/ExhibitionGrid.tsx`

```tsx
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Code2, ExternalLink, Box, Sun, Building2, Sunset, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { useToastStore } from '@/components/ui/Toast';

export interface ExhibitionClientData {
  id: string;
  title: string;
  environment: string;
  variantsCount: number;
  hotspotsCount: number;
  updatedAt: number;
  isPublished: boolean;
}

const ENV_GRADIENTS: Record<string, string> = {
  studio: 'from-slate-800 via-slate-600 to-slate-900',
  city: 'from-sky-900 via-blue-800 to-slate-900',
  sunset: 'from-orange-900 via-rose-800 to-purple-900',
  warehouse: 'from-amber-900 via-stone-800 to-zinc-900',
  default: 'from-zinc-800 via-zinc-700 to-zinc-900',
};

const ENV_ICONS: Record<string, React.ElementType> = {
  studio: Sun,
  city: Building2,
  sunset: Sunset,
  warehouse: Warehouse,
  default: Box,
};

const ExhibitionCard = memo(({ exhibition }: { exhibition: ExhibitionClientData }) => {
  const { showToast } = useToastStore();
  
  const env = exhibition.environment?.toLowerCase() || 'studio';
  const gradient = ENV_GRADIENTS[env] || ENV_GRADIENTS.default;
  const EnvIcon = ENV_ICONS[env] || ENV_ICONS.default;

  const handleEmbed = () => {
    const code = `<iframe src="https://exhibitxr.com/embed/${exhibition.id}" width="100%" height="600" frameborder="0" allow="xr-spatial-tracking" allowfullscreen></iframe>`;
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
        <EnvIcon className="w-12 h-12 text-white/30 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:text-white/50" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-medium text-white mb-1 truncate" title={exhibition.title}>
          {exhibition.title || 'Untitled Exhibition'}
        </h3>
        <p className="text-sm text-white/50 mb-6 font-medium capitalize">
          {env} • {exhibition.variantsCount} variant{exhibition.variantsCount !== 1 ? 's' : ''} • {exhibition.hotspotsCount} hotspot{exhibition.hotspotsCount !== 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-3 gap-2 mt-auto">
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
    </div>
  );
});

ExhibitionCard.displayName = 'ExhibitionCard';

export function ExhibitionGrid({ exhibitions }: { exhibitions: ExhibitionClientData[] }) {
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
          <ExhibitionCard exhibition={ex} />
        </motion.div>
      ))}
    </div>
  );
}

```

### 4. `src/components/dashboard/ActivityFeed.tsx`

```tsx
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
                      <>Neue Ausstellung <span className="font-medium text-white/90">"{activity.title}"</span> erstellt</>
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

```

### 5. `src/components/dashboard/DashboardHeader.tsx`

```tsx
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
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setGreeting('Guten Morgen');
    else if (hour >= 12 && hour < 18) setGreeting('Guten Tag');
    else if (hour >= 18 && hour < 22) setGreeting('Guten Abend');
    else setGreeting('Gute Nacht');
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

```

### 6. `src/app/(dashboard)/dashboard/page.tsx`

```tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebaseAdmin';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsGrid, type DashboardStats } from '@/components/dashboard/StatsGrid';
import { ExhibitionGrid, type ExhibitionClientData } from '@/components/dashboard/ExhibitionGrid';
import { ActivityFeed, type Activity } from '@/components/dashboard/ActivityFeed';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'Dashboard | ExhibitXR',
};

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { tenantId, name, email } = session;

  let exhibitions: ExhibitionClientData[] = [];
  
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('exhibitions')
      .orderBy('updatedAt', 'desc')
      .get();
      
    // Serialization Boundary für sicheren React-Transfer
    exhibitions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || data.name || 'Ohne Titel',
        environment: data.config?.environment || data.environment || 'studio',
        variantsCount: Array.isArray(data.config?.variants) ? data.config.variants.length : 0,
        hotspotsCount: Array.isArray(data.config?.hotspots) ? data.config.hotspots.length : 0,
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
        isPublished: data.isPublished || false,
      };
    });
  } catch (error) {
    console.error('Failed to fetch exhibitions:', error);
  }

  const activeCount = exhibitions.length;
  const publishedCount = exhibitions.filter(e => e.isPublished).length;
  const publishedRate = activeCount > 0 ? Math.round((publishedCount / activeCount) * 100) : 0;

  // Mock-Daten der Metriken gemäss Anweisung
  const stats: DashboardStats = {
    total: activeCount,
    published: publishedCount,
    views: 2400,
    avgSession: 45,
    trends: {
      total: 3, 
      published: publishedRate, 
      views: 12, 
      avgSession: -5, 
    }
  };

  // Mock-Activities
  const activities: Activity[] = exhibitions.slice(0, 10).map((ex, i) => {
    const types: Activity['type'][] = ['edited', 'published', 'created', 'model_generated', 'viewed'];
    let type = ex.isPublished ? 'published' : types[i % types.length];
    
    if (i === 0) type = 'edited';
    if (i === exhibitions.length - 1) type = 'created';

    return {
      id: `act-${ex.id}-${i}`,
      type: type as Activity['type'],
      title: ex.title,
      timestamp: ex.updatedAt - (i * 3600000), // Fake time offset
      exhibitionId: ex.id,
    };
  });

  const userNameRaw = name || (email ? email.split('@')[0] : 'Benutzer');
  const userName = userNameRaw.charAt(0).toUpperCase() + userNameRaw.slice(1);

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <DashboardHeader 
        userName={userName} 
        stats={{ active: activeCount, published: publishedCount }} 
      />
      
      <StatsGrid stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <ExhibitionGrid exhibitions={exhibitions} />
        <ActivityFeed activities={activities} />
      </div>
      
      <ToastProvider />
    </div>
  );
}

```