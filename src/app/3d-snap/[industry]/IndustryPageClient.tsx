'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ModelViewer from "@/components/3d/ModelViewer";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { 
  ArrowUpRight, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Maximize,
  ChevronLeft
} from 'lucide-react';
import { IndustryConfig } from '@/data/industries';

interface IndustryPageClientProps {
  config: IndustryConfig;
  industry: string;
}

export default function IndustryPageClient({ config, industry }: IndustryPageClientProps) {
  // Mock-Config für den Viewer
  const heroModelConfig = useMemo(() => ({
    id: `hero-${config.slug}`,
    label: config.name,
    glbUrl: (config.heroModelUrl && config.heroModelUrl.startsWith('http')) ? config.heroModelUrl : '', 
    scale: 1,
    position: [0, 0, 0] as [number, number, number],
    variants: [],
    hotspots: []
  }), [config]);

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `3D-Snap für ${config.name}`,
    "description": config.description,
    "provider": { 
      "@type": "Organization", 
      "name": "ExhibitXR",
      "url": "https://3d-snap.com"
    },
    "serviceType": "AI 3D Model Generation",
    "areaServed": "Global",
    "offers": {
      "@type": "Offer",
      "description": "Kostenloser Test-Snap verfügbar"
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20">
      <JsonLd data={jsonLdData} />
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference">
        <Link href="/" className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Startseite
        </Link>
        <div className="text-[10px] font-black tracking-[0.5em] uppercase text-zinc-700">ExhibitXR Industry Suite</div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Header Section */}
        <header className="mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#00aaff] text-[10px] font-black uppercase tracking-widest mb-6">
            <Zap size={12} fill="currentColor" /> Branchen-Lösung
          </div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6"
          >
            {config.name.split(' ')[0]}<span className="text-[#00aaff]">.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-500 max-w-xl leading-relaxed"
          >
            {config.description} Profitieren Sie von automatisierten Workflows für maximale Conversion-Rates.
          </motion.p>
        </header>

        {/* The Industry Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[300px]">
          
          {/* 1. Large 3D Showcase Block */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-8 md:row-span-2 bg-zinc-900/10 border border-white/5 rounded-[2.5rem] relative overflow-hidden group"
          >
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              {heroModelConfig.glbUrl ? (
                <ModelViewer config={heroModelConfig} />
              ) : (
                <div className="flex flex-col items-center gap-4 text-zinc-800">
                  <Maximize size={48} className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Interactive Showcase</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-10 left-10 z-20">
              <span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Live Preview</span>
              <h2 className="text-3xl font-bold">Technologie-Standard</h2>
              <p className="text-zinc-400 text-sm max-w-xs">High-Fidelity Assets, bereit für WebGL und Augmented Reality.</p>
            </div>
          </motion.div>

          {/* 2. Specs Block */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-4 bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-center"
          >
            <Layers className="text-zinc-700 mb-6" size={32} />
            <h3 className="text-xl font-bold mb-4">Optimierte Assets</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="flex justify-between"><span>Polygone</span> <span className="text-white">Low-Poly ready</span></li>
              <li className="flex justify-between"><span>Texturen</span> <span className="text-white">PBR 4K / WebP</span></li>
              <li className="flex justify-between"><span>Format</span> <span className="text-white">GLB / USDZ</span></li>
            </ul>
          </motion.div>

          {/* 3. Performance CTA Block */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-4 bg-white rounded-[2.5rem] p-8 flex flex-col group cursor-pointer"
          >
            <div className="mb-auto flex justify-between items-start">
              <Zap className="text-black" size={32} />
              <ArrowUpRight className="text-black group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
            <Link href="/register">
              <h3 className="text-2xl font-black text-black leading-tight">Jetzt für {config.name} starten</h3>
              <p className="text-black/60 text-xs font-bold mt-2 uppercase tracking-widest">Kostenloser Test-Snap</p>
            </Link>
          </motion.div>

          {/* 4. Category Loop */}
          {config.categories.map((cat, idx) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.05) }}
              className="md:col-span-4 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 hover:bg-zinc-900/40 transition-all flex flex-col group"
            >
              <div className="mb-auto">
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Kategorie</span>
                <h4 className="text-2xl font-bold mt-2">{cat.name}</h4>
              </div>
              <p className="text-zinc-500 text-xs mb-6 line-clamp-2">{cat.description}</p>
              <Link 
                href={`/3d-snap/${industry}/${cat.slug}`}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Deep Dive <ArrowUpRight size={12} />
              </Link>
            </motion.div>
          ))}

          {/* 5. Trust Block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-8 bg-zinc-900/10 border border-white/5 rounded-[2.5rem] p-10 flex items-center gap-8"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Enterprise-Grade Qualität</h3>
              <p className="text-sm text-zinc-500 max-w-md">Alle {config.name}-Modelle durchlaufen unsere automatisierte Quality-Gate Pipeline für maximale Plattform-Kompatibilität.</p>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
