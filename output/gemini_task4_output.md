# Gemini Task 4: Embed \& Share System

# Paste the full Gemini Deep Think output below this line:Hier ist die vollständige, produktionsreife Implementierung des \*\*Premium B2B Dashboards\*\*.

# 

# Alle Architektur- und Design-Vorgaben wurden strikt umgesetzt: Glassmorphism (subtil), Premium-Micro-Animations mit Framer Motion, striktes TypeScript ohne `any` und eine saubere Trennung von Server/Client Components zur Einhaltung der Serialization Boundary (es werden nur primitive Daten wie `number` für Timestamps übergeben).

# 

# \### 1. `src/components/dashboard/StatsGrid.tsx`

# 

# ```tsx

# 'use client';

# 

# import { useEffect } from 'react';

# import { motion, useSpring, useTransform } from 'framer-motion';

# import { Layers, Globe, Eye, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

# 

# export interface DashboardStats {

# &nbsp; total: number;

# &nbsp; published: number;

# &nbsp; views: number;

# &nbsp; avgSession: number;

# &nbsp; trends: {

# &nbsp;   total: number;

# &nbsp;   published: number;

# &nbsp;   views: number;

# &nbsp;   avgSession: number;

# &nbsp; };

# }

# 

# interface StatsGridProps {

# &nbsp; stats: DashboardStats;

# }

# 

# function AnimatedCounter({ value, isK = false, suffix = '' }: { value: number; isK?: boolean; suffix?: string }) {

# &nbsp; const spring = useSpring(0, { bounce: 0, duration: 1500 });

# &nbsp; const display = useTransform(spring, (current) => {

# &nbsp;   const val = Math.round(current);

# &nbsp;   if (isK \&\& val >= 1000) {

# &nbsp;     return (val / 1000).toFixed(1) + 'k' + suffix;

# &nbsp;   }

# &nbsp;   return val.toString() + suffix;

# &nbsp; });

# 

# &nbsp; useEffect(() => {

# &nbsp;   spring.set(value);

# &nbsp; }, \[spring, value]);

# 

# &nbsp; return <motion.span>{display}</motion.span>;

# }

# 

# export function StatsGrid({ stats }: StatsGridProps) {

# &nbsp; const cards = \[

# &nbsp;   {

# &nbsp;     title: 'Exhibitions',

# &nbsp;     value: stats.total,

# &nbsp;     icon: Layers,

# &nbsp;     trend: stats.trends.total,

# &nbsp;     trendText: `+${stats.trends.total} this mo`,

# &nbsp;     isPositive: stats.trends.total >= 0,

# &nbsp;     color: 'text-\[#00aaff]',

# &nbsp;   },

# &nbsp;   {

# &nbsp;     title: 'Published',

# &nbsp;     value: stats.published,

# &nbsp;     icon: Globe,

# &nbsp;     trend: stats.trends.published,

# &nbsp;     trendText: `${stats.trends.published}% rate`,

# &nbsp;     isPositive: true,

# &nbsp;     color: 'text-emerald-400',

# &nbsp;   },

# &nbsp;   {

# &nbsp;     title: 'Views (30d)',

# &nbsp;     value: stats.views,

# &nbsp;     icon: Eye,

# &nbsp;     trend: stats.trends.views,

# &nbsp;     trendText: `${stats.trends.views >= 0 ? '+' : ''}${stats.trends.views}% ↑`,

# &nbsp;     isPositive: stats.trends.views >= 0,

# &nbsp;     color: 'text-purple-400',

# &nbsp;     isK: true,

# &nbsp;   },

# &nbsp;   {

# &nbsp;     title: 'Avg. Session',

# &nbsp;     value: stats.avgSession,

# &nbsp;     icon: Clock,

# &nbsp;     trend: stats.trends.avgSession,

# &nbsp;     trendText: `${stats.trends.avgSession >= 0 ? '+' : ''}${stats.trends.avgSession}% ${stats.trends.avgSession >= 0 ? '↑' : '↓'}`,

# &nbsp;     isPositive: stats.trends.avgSession >= 0,

# &nbsp;     color: 'text-amber-400',

# &nbsp;     suffix: 's',

# &nbsp;   },

# &nbsp; ];

# 

# &nbsp; return (

# &nbsp;   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

# &nbsp;     {cards.map((card, i) => {

# &nbsp;       const TrendIcon = card.isPositive ? ArrowUpRight : ArrowDownRight;

# &nbsp;       return (

# &nbsp;         <motion.div

# &nbsp;           key={card.title}

# &nbsp;           initial={{ opacity: 0, y: 20 }}

# &nbsp;           animate={{ opacity: 1, y: 0 }}

# &nbsp;           transition={{ delay: i \* 0.05, duration: 0.4, ease: 'easeOut' }}

# &nbsp;           className="bg-white/\[0.04] border border-white/\[0.08] rounded-2xl p-6 relative overflow-hidden group hover:bg-white/\[0.06] transition-colors"

# &nbsp;         >

# &nbsp;           <div className="flex justify-between items-start mb-4 relative z-10">

# &nbsp;             <div className="p-2.5 bg-white/\[0.04] rounded-xl border border-white/\[0.08]">

# &nbsp;               <card.icon className={`w-5 h-5 ${card.color}`} strokeWidth={2} />

# &nbsp;             </div>

# &nbsp;             <div className={`flex items-center gap-1 text-sm font-medium ${card.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>

# &nbsp;               <TrendIcon className="w-4 h-4" />

# &nbsp;               <span>{card.trendText}</span>

# &nbsp;             </div>

# &nbsp;           </div>

# &nbsp;           

# &nbsp;           <div className="relative z-10">

# &nbsp;             <h3 className="text-white/60 text-sm font-medium mb-1">{card.title}</h3>

# &nbsp;             <div className="text-3xl font-semibold text-white tracking-tight flex items-baseline">

# &nbsp;               <AnimatedCounter value={card.value} isK={card.isK} suffix={card.suffix} />

# &nbsp;             </div>

# &nbsp;           </div>

# 

# &nbsp;           <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/\[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

# &nbsp;         </motion.div>

# &nbsp;       );

# &nbsp;     })}

# &nbsp;   </div>

# &nbsp; );

# }

# 

# ```

# 

# \### 2. `src/components/ui/Toast.tsx`

# 

# ```tsx

# 'use client';

# 

# import { create } from 'zustand';

# import { useEffect, useState } from 'react';

# import { createPortal } from 'react-dom';

# import { motion, AnimatePresence } from 'framer-motion';

# import { CheckCircle2 } from 'lucide-react';

# 

# interface ToastStore {

# &nbsp; message: string | null;

# &nbsp; showToast: (msg: string) => void;

# &nbsp; hideToast: () => void;

# }

# 

# export const useToastStore = create<ToastStore>((set) => {

# &nbsp; let timeoutId: NodeJS.Timeout;

# &nbsp; 

# &nbsp; return {

# &nbsp;   message: null,

# &nbsp;   showToast: (msg) => {

# &nbsp;     set({ message: msg });

# &nbsp;     if (timeoutId) clearTimeout(timeoutId);

# &nbsp;     timeoutId = setTimeout(() => {

# &nbsp;       set({ message: null });

# &nbsp;     }, 3000);

# &nbsp;   },

# &nbsp;   hideToast: () => {

# &nbsp;     set({ message: null });

# &nbsp;     if (timeoutId) clearTimeout(timeoutId);

# &nbsp;   },

# &nbsp; };

# });

# 

# export function ToastProvider() {

# &nbsp; const { message } = useToastStore();

# &nbsp; const \[mounted, setMounted] = useState(false);

# 

# &nbsp; useEffect(() => {

# &nbsp;   setMounted(true);

# &nbsp; }, \[]);

# 

# &nbsp; if (!mounted || typeof document === 'undefined') return null;

# 

# &nbsp; return createPortal(

# &nbsp;   <AnimatePresence>

# &nbsp;     {message \&\& (

# &nbsp;       <motion.div

# &nbsp;         initial={{ opacity: 0, y: 50, x: '-50%' }}

# &nbsp;         animate={{ opacity: 1, y: 0, x: '-50%' }}

# &nbsp;         exit={{ opacity: 0, y: 20, x: '-50%' }}

# &nbsp;         className="fixed bottom-8 left-1/2 z-\[9999] flex items-center gap-2 px-6 py-3 bg-\[#1a1a24] text-white border border-white/10 text-sm font-medium rounded-full shadow-\[0\_8px\_32px\_rgba(0,170,255,0.15)]"

# &nbsp;       >

# &nbsp;         <CheckCircle2 className="w-4 h-4 text-emerald-400" />

# &nbsp;         {message}

# &nbsp;       </motion.div>

# &nbsp;     )}

# &nbsp;   </AnimatePresence>,

# &nbsp;   document.body

# &nbsp; );

# }

# 

# ```

# 

# \### 3. `src/components/dashboard/ExhibitionGrid.tsx`

# 

# ```tsx

# 'use client';

# 

# import { memo } from 'react';

# import { motion } from 'framer-motion';

# import { Pencil, Code2, ExternalLink, Box, Sun, Building2, Sunset, Warehouse } from 'lucide-react';

# import Link from 'next/link';

# import { useToastStore } from '@/components/ui/Toast';

# 

# export interface ExhibitionClientData {

# &nbsp; id: string;

# &nbsp; title: string;

# &nbsp; environment: string;

# &nbsp; variantsCount: number;

# &nbsp; hotspotsCount: number;

# &nbsp; updatedAt: number;

# &nbsp; isPublished: boolean;

# }

# 

# const ENV\_GRADIENTS: Record<string, string> = {

# &nbsp; studio: 'from-slate-800 via-slate-600 to-slate-900',

# &nbsp; city: 'from-sky-900 via-blue-800 to-slate-900',

# &nbsp; sunset: 'from-orange-900 via-rose-800 to-purple-900',

# &nbsp; warehouse: 'from-amber-900 via-stone-800 to-zinc-900',

# &nbsp; default: 'from-zinc-800 via-zinc-700 to-zinc-900',

# };

# 

# const ENV\_ICONS: Record<string, React.ElementType> = {

# &nbsp; studio: Sun,

# &nbsp; city: Building2,

# &nbsp; sunset: Sunset,

# &nbsp; warehouse: Warehouse,

# &nbsp; default: Box,

# };

# 

# const ExhibitionCard = memo(({ exhibition }: { exhibition: ExhibitionClientData }) => {

# &nbsp; const { showToast } = useToastStore();

# &nbsp; 

# &nbsp; const env = exhibition.environment?.toLowerCase() || 'studio';

# &nbsp; const gradient = ENV\_GRADIENTS\[env] || ENV\_GRADIENTS.default;

# &nbsp; const EnvIcon = ENV\_ICONS\[env] || ENV\_ICONS.default;

# 

# &nbsp; const handleEmbed = () => {

# &nbsp;   const code = `<iframe src="https://exhibitxr.com/embed/${exhibition.id}" width="100%" height="600" frameborder="0" allow="xr-spatial-tracking" allowfullscreen></iframe>`;

# &nbsp;   navigator.clipboard.writeText(code);

# &nbsp;   showToast('Embed-Code kopiert! ✓');

# &nbsp; };

# 

# &nbsp; const formattedDate = new Intl.DateTimeFormat('de-DE', {

# &nbsp;   day: '2-digit', month: '2-digit', year: 'numeric',

# &nbsp;   hour: '2-digit', minute: '2-digit'

# &nbsp; }).format(new Date(exhibition.updatedAt));

# 

# &nbsp; return (

# &nbsp;   <div className="group flex flex-col bg-white/\[0.04] border border-white/\[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-\[1.02] hover:shadow-\[0\_8px\_32px\_rgba(0,170,255,0.08)] h-full">

# &nbsp;     <div className={`relative h-44 w-full bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>

# &nbsp;       <div className="absolute inset-0 bg-\[#0a0a0f]/20 mix-blend-overlay" />

# &nbsp;       <EnvIcon className="w-12 h-12 text-white/30 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:text-white/50" strokeWidth={1.5} />

# &nbsp;     </div>

# 

# &nbsp;     <div className="flex flex-col flex-1 p-5">

# &nbsp;       <h3 className="text-lg font-medium text-white mb-1 truncate" title={exhibition.title}>

# &nbsp;         {exhibition.title || 'Untitled Exhibition'}

# &nbsp;       </h3>

# &nbsp;       <p className="text-sm text-white/50 mb-6 font-medium capitalize">

# &nbsp;         {env} • {exhibition.variantsCount} variant{exhibition.variantsCount !== 1 ? 's' : ''} • {exhibition.hotspotsCount} hotspot{exhibition.hotspotsCount !== 1 ? 's' : ''}

# &nbsp;       </p>

# 

# &nbsp;       <div className="grid grid-cols-3 gap-2 mt-auto">

# &nbsp;         <Link

# &nbsp;           href={`/dashboard/editor/${exhibition.id}`}

# &nbsp;           aria-label="Edit Exhibition"

# &nbsp;           className="flex items-center justify-center gap-1.5 py-2.5 bg-white/\[0.04] hover:bg-white/\[0.08] rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-\[#00aaff]"

# &nbsp;         >

# &nbsp;           <Pencil className="w-4 h-4" />

# &nbsp;           Edit

# &nbsp;         </Link>

# &nbsp;         <button

# &nbsp;           onClick={handleEmbed}

# &nbsp;           aria-label="Copy Embed Code"

# &nbsp;           className="flex items-center justify-center gap-1.5 py-2.5 bg-white/\[0.04] hover:bg-white/\[0.08] rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-\[#00aaff] cursor-pointer"

# &nbsp;         >

# &nbsp;           <Code2 className="w-4 h-4" />

# &nbsp;           Embed

# &nbsp;         </button>

# &nbsp;         <a

# &nbsp;           href={`/embed/${exhibition.id}`}

# &nbsp;           target="\_blank"

# &nbsp;           rel="noopener noreferrer"

# &nbsp;           aria-label="Preview Exhibition"

# &nbsp;           className="flex items-center justify-center gap-1.5 py-2.5 bg-white/\[0.04] hover:bg-white/\[0.08] rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-\[#00aaff]"

# &nbsp;         >

# &nbsp;           <ExternalLink className="w-4 h-4" />

# &nbsp;           Share

# &nbsp;         </a>

# &nbsp;       </div>

# 

# &nbsp;       <div className="mt-5 pt-4 border-t border-white/\[0.08] flex items-center justify-between text-xs">

# &nbsp;         <span className="text-white/40 font-medium">Updated: {formattedDate}</span>

# &nbsp;         <div className="flex items-center gap-1.5 font-medium">

# &nbsp;           <span className={`w-2 h-2 rounded-full ${exhibition.isPublished ? 'bg-emerald-500 shadow-\[0\_0\_8px\_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />

# &nbsp;           <span className={exhibition.isPublished ? 'text-white/80' : 'text-white/40'}>

# &nbsp;             {exhibition.isPublished ? 'Published' : 'Draft'}

# &nbsp;           </span>

# &nbsp;         </div>

# &nbsp;       </div>

# &nbsp;     </div>

# &nbsp;   </div>

# &nbsp; );

# });

# 

# ExhibitionCard.displayName = 'ExhibitionCard';

# 

# export function ExhibitionGrid({ exhibitions }: { exhibitions: ExhibitionClientData\[] }) {

# &nbsp; if (exhibitions.length === 0) {

# &nbsp;   return (

# &nbsp;     <div className="flex flex-col items-center justify-center py-24 bg-white/\[0.02] border border-white/\[0.08] border-dashed rounded-2xl text-center">

# &nbsp;       <Box className="w-12 h-12 text-white/20 mb-4" />

# &nbsp;       <h3 className="text-lg font-medium text-white mb-2">Keine Ausstellungen</h3>

# &nbsp;       <p className="text-sm text-white/50 max-w-sm">

# &nbsp;         Erstelle deine erste interaktive 3D-Ausstellung, um deine Produkte zu präsentieren.

# &nbsp;       </p>

# &nbsp;     </div>

# &nbsp;   );

# &nbsp; }

# 

# &nbsp; return (

# &nbsp;   <div className="grid grid-cols-\[repeat(auto-fill,minmax(320px,1fr))] gap-6 content-start">

# &nbsp;     {exhibitions.map((ex, i) => (

# &nbsp;       <motion.div

# &nbsp;         key={ex.id}

# &nbsp;         initial={{ opacity: 0, scale: 0.95 }}

# &nbsp;         animate={{ opacity: 1, scale: 1 }}

# &nbsp;         transition={{ delay: i \* 0.05, duration: 0.3 }}

# &nbsp;       >

# &nbsp;         <ExhibitionCard exhibition={ex} />

# &nbsp;       </motion.div>

# &nbsp;     ))}

# &nbsp;   </div>

# &nbsp; );

# }

# 

# ```

# 

# \### 4. `src/components/dashboard/ActivityFeed.tsx`

# 

# ```tsx

# 'use client';

# 

# import { motion, AnimatePresence } from 'framer-motion';

# 

# export type ActivityType = 'edited' | 'published' | 'created' | 'model\_generated' | 'viewed';

# 

# export interface Activity {

# &nbsp; id: string;

# &nbsp; type: ActivityType;

# &nbsp; title: string;

# &nbsp; timestamp: number;

# &nbsp; exhibitionId: string;

# }

# 

# interface ActivityFeedProps {

# &nbsp; activities: Activity\[];

# }

# 

# const EMOJIS: Record<ActivityType, string> = {

# &nbsp; edited: '🎨',

# &nbsp; published: '📤',

# &nbsp; created: '🆕',

# &nbsp; model\_generated: '🤖',

# &nbsp; viewed: '👁️',

# };

# 

# const ACTION\_TEXT: Record<ActivityType, string> = {

# &nbsp; edited: 'bearbeitet',

# &nbsp; published: 'veröffentlicht',

# &nbsp; created: 'erstellt',

# &nbsp; model\_generated: 'generiert (KI)',

# &nbsp; viewed: 'angesehen',

# };

# 

# function formatTime(ts: number) {

# &nbsp; return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));

# }

# 

# export function ActivityFeed({ activities }: ActivityFeedProps) {

# &nbsp; return (

# &nbsp;   <div className="bg-white/\[0.04] border border-white/\[0.08] rounded-2xl p-6 h-fit sticky top-6">

# &nbsp;     <h3 className="text-sm font-semibold text-white/80 tracking-wider mb-6 pb-4 border-b border-white/\[0.08] uppercase">

# &nbsp;       Letzte Aktivitäten

# &nbsp;     </h3>

# &nbsp;     

# &nbsp;     <div className="relative">

# &nbsp;       <div className="absolute left-\[11px] top-2 bottom-2 w-px bg-white/\[0.08]" />

# &nbsp;       

# &nbsp;       <ul className="space-y-6">

# &nbsp;         <AnimatePresence>

# &nbsp;           {activities.slice(0, 10).map((activity, i) => (

# &nbsp;             <motion.li

# &nbsp;               key={activity.id}

# &nbsp;               initial={{ opacity: 0, x: 20 }}

# &nbsp;               animate={{ opacity: 1, x: 0 }}

# &nbsp;               transition={{ delay: i \* 0.05, duration: 0.3 }}

# &nbsp;               className="relative flex items-start gap-4"

# &nbsp;             >

# &nbsp;               <div className="relative z-10 w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 rounded-full bg-\[#0a0a0f] ring-4 ring-\[#0a0a0f]">

# &nbsp;                 <span className="text-sm leading-none">{EMOJIS\[activity.type]}</span>

# &nbsp;               </div>

# &nbsp;               <div className="flex flex-col">

# &nbsp;                 <span className="text-xs text-white/40 font-mono mb-0.5">

# &nbsp;                   {formatTime(activity.timestamp)}

# &nbsp;                 </span>

# &nbsp;                 <div className="text-sm text-white/60 leading-tight">

# &nbsp;                   {activity.type === 'created' ? (

# &nbsp;                     <>Neue Ausstellung <span className="font-medium text-white/90">"{activity.title}"</span> erstellt</>

# &nbsp;                   ) : activity.type === 'model\_generated' ? (

# &nbsp;                     <>3D-Modell generiert <span className="font-medium text-white/90">({activity.title})</span></>

# &nbsp;                   ) : (

# &nbsp;                     <>

# &nbsp;                       <span className="font-medium text-white/90">{activity.title}</span>{' '}

# &nbsp;                       {ACTION\_TEXT\[activity.type]}

# &nbsp;                     </>

# &nbsp;                   )}

# &nbsp;                 </div>

# &nbsp;               </div>

# &nbsp;             </motion.li>

# &nbsp;           ))}

# &nbsp;         </AnimatePresence>

# &nbsp;       </ul>

# &nbsp;       

# &nbsp;       {activities.length === 0 \&\& (

# &nbsp;         <p className="text-sm text-white/40 py-4">Keine Aktivitäten vorhanden.</p>

# &nbsp;       )}

# &nbsp;     </div>

# &nbsp;   </div>

# &nbsp; );

# }

# 

# ```

# 

# \### 5. `src/components/dashboard/DashboardHeader.tsx`

# 

# ```tsx

# 'use client';

# 

# import { useState, useEffect } from 'react';

# import { Plus, Camera } from 'lucide-react';

# import Link from 'next/link';

# import { motion } from 'framer-motion';

# 

# interface DashboardHeaderProps {

# &nbsp; userName: string;

# &nbsp; stats: {

# &nbsp;   active: number;

# &nbsp;   published: number;

# &nbsp; };

# }

# 

# export function DashboardHeader({ userName, stats }: DashboardHeaderProps) {

# &nbsp; const \[greeting, setGreeting] = useState('Guten Tag');

# &nbsp; const \[mounted, setMounted] = useState(false);

# 

# &nbsp; useEffect(() => {

# &nbsp;   setMounted(true);

# &nbsp;   const hour = new Date().getHours();

# &nbsp;   if (hour >= 6 \&\& hour < 12) setGreeting('Guten Morgen');

# &nbsp;   else if (hour >= 12 \&\& hour < 18) setGreeting('Guten Tag');

# &nbsp;   else if (hour >= 18 \&\& hour < 22) setGreeting('Guten Abend');

# &nbsp;   else setGreeting('Gute Nacht');

# &nbsp; }, \[]);

# 

# &nbsp; return (

# &nbsp;   <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 pt-4">

# &nbsp;     <div>

# &nbsp;       <h1 className="text-3xl font-semibold text-white tracking-tight mb-2 flex items-center gap-2">

# &nbsp;         {mounted ? greeting : 'Guten Tag'}, {userName} 

# &nbsp;         <motion.span 

# &nbsp;           className="inline-block origin-\[70%\_70%]"

# &nbsp;           animate={{ rotate: \[0, 14, -8, 14, -4, 10, 0] }}

# &nbsp;           transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}

# &nbsp;         >

# &nbsp;           👋

# &nbsp;         </motion.span>

# &nbsp;       </h1>

# &nbsp;       <p className="text-white/50 text-sm font-medium">

# &nbsp;         {stats.active} {stats.active === 1 ? 'Ausstellung' : 'Ausstellungen'} aktiv <span className="mx-1">•</span> {stats.published} veröffentlicht

# &nbsp;       </p>

# &nbsp;     </div>

# 

# &nbsp;     <div className="flex items-center gap-3">

# &nbsp;       <Link 

# &nbsp;         href="/dashboard/exhibitions/new"

# &nbsp;         className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/\[0.04] hover:bg-white/\[0.08] border border-white/\[0.08] rounded-xl text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-\[#00aaff]"

# &nbsp;       >

# &nbsp;         <Camera className="w-4 h-4 text-white/60" />

# &nbsp;         <span>📸 Foto → 3D</span>

# &nbsp;       </Link>

# &nbsp;       <Link 

# &nbsp;         href="/dashboard/exhibitions/new"

# &nbsp;         className="flex items-center justify-center gap-2 px-4 py-2.5 bg-\[#00aaff] hover:bg-\[#0099e6] rounded-xl text-sm font-medium text-white transition-all shadow-\[0\_0\_20px\_rgba(0,170,255,0.3)] hover:shadow-\[0\_0\_25px\_rgba(0,170,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"

# &nbsp;       >

# &nbsp;         <Plus className="w-4 h-4" />

# &nbsp;         <span>+ Neue Ausstellung</span>

# &nbsp;       </Link>

# &nbsp;     </div>

# &nbsp;   </div>

# &nbsp; );

# }

# 

# ```

# 

# \### 6. `src/app/(dashboard)/dashboard/page.tsx`

# 

# ```tsx

# import { redirect } from 'next/navigation';

# import { getSession } from '@/lib/session';

# import { adminDb } from '@/lib/firebaseAdmin';

# 

# import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

# import { StatsGrid, type DashboardStats } from '@/components/dashboard/StatsGrid';

# import { ExhibitionGrid, type ExhibitionClientData } from '@/components/dashboard/ExhibitionGrid';

# import { ActivityFeed, type Activity } from '@/components/dashboard/ActivityFeed';

# import { ToastProvider } from '@/components/ui/Toast';

# 

# export const metadata = {

# &nbsp; title: 'Dashboard | ExhibitXR',

# };

# 

# export default async function DashboardPage() {

# &nbsp; const session = await getSession();

# &nbsp; 

# &nbsp; if (!session) {

# &nbsp;   redirect('/login');

# &nbsp; }

# 

# &nbsp; const { tenantId, name, email } = session;

# 

# &nbsp; let exhibitions: ExhibitionClientData\[] = \[];

# &nbsp; 

# &nbsp; try {

# &nbsp;   const snapshot = await adminDb

# &nbsp;     .collection('tenants')

# &nbsp;     .doc(tenantId)

# &nbsp;     .collection('exhibitions')

# &nbsp;     .orderBy('updatedAt', 'desc')

# &nbsp;     .get();

# &nbsp;     

# &nbsp;   // Serialization Boundary für sicheren React-Transfer

# &nbsp;   exhibitions = snapshot.docs.map(doc => {

# &nbsp;     const data = doc.data();

# &nbsp;     return {

# &nbsp;       id: doc.id,

# &nbsp;       title: data.title || data.name || 'Ohne Titel',

# &nbsp;       environment: data.config?.environment || data.environment || 'studio',

# &nbsp;       variantsCount: Array.isArray(data.config?.variants) ? data.config.variants.length : 0,

# &nbsp;       hotspotsCount: Array.isArray(data.config?.hotspots) ? data.config.hotspots.length : 0,

# &nbsp;       updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),

# &nbsp;       isPublished: data.isPublished || false,

# &nbsp;     };

# &nbsp;   });

# &nbsp; } catch (error) {

# &nbsp;   console.error('Failed to fetch exhibitions:', error);

# &nbsp; }

# 

# &nbsp; const activeCount = exhibitions.length;

# &nbsp; const publishedCount = exhibitions.filter(e => e.isPublished).length;

# &nbsp; const publishedRate = activeCount > 0 ? Math.round((publishedCount / activeCount) \* 100) : 0;

# 

# &nbsp; // Mock-Daten der Metriken gemäss Anweisung

# &nbsp; const stats: DashboardStats = {

# &nbsp;   total: activeCount,

# &nbsp;   published: publishedCount,

# &nbsp;   views: 2400,

# &nbsp;   avgSession: 45,

# &nbsp;   trends: {

# &nbsp;     total: 3, 

# &nbsp;     published: publishedRate, 

# &nbsp;     views: 12, 

# &nbsp;     avgSession: -5, 

# &nbsp;   }

# &nbsp; };

# 

# &nbsp; // Mock-Activities

# &nbsp; const activities: Activity\[] = exhibitions.slice(0, 10).map((ex, i) => {

# &nbsp;   const types: Activity\['type']\[] = \['edited', 'published', 'created', 'model\_generated', 'viewed'];

# &nbsp;   let type = ex.isPublished ? 'published' : types\[i % types.length];

# &nbsp;   

# &nbsp;   if (i === 0) type = 'edited';

# &nbsp;   if (i === exhibitions.length - 1) type = 'created';

# 

# &nbsp;   return {

# &nbsp;     id: `act-${ex.id}-${i}`,

# &nbsp;     type: type as Activity\['type'],

# &nbsp;     title: ex.title,

# &nbsp;     timestamp: ex.updatedAt - (i \* 3600000), // Fake time offset

# &nbsp;     exhibitionId: ex.id,

# &nbsp;   };

# &nbsp; });

# 

# &nbsp; const userNameRaw = name || (email ? email.split('@')\[0] : 'Benutzer');

# &nbsp; const userName = userNameRaw.charAt(0).toUpperCase() + userNameRaw.slice(1);

# 

# &nbsp; return (

# &nbsp;   <div className="w-full max-w-\[1600px] mx-auto pb-12">

# &nbsp;     <DashboardHeader 

# &nbsp;       userName={userName} 

# &nbsp;       stats={{ active: activeCount, published: publishedCount }} 

# &nbsp;     />

# &nbsp;     

# &nbsp;     <StatsGrid stats={stats} />

# &nbsp;     

# &nbsp;     <div className="grid grid-cols-1 lg:grid-cols-\[1fr\_320px] gap-8 items-start">

# &nbsp;       <ExhibitionGrid exhibitions={exhibitions} />

# &nbsp;       <ActivityFeed activities={activities} />

# &nbsp;     </div>

# &nbsp;     

# &nbsp;     <ToastProvider />

# &nbsp;   </div>

# &nbsp; );

# }

# 

# ```

