'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { industries } from "@/data/industries";
import JsonLd from "@/components/seo/JsonLd";
import type { LucideIcon } from 'lucide-react';
import { 
  ChevronRight, 
  Box, 
  Watch, 
  Smartphone, 
  Settings, 
  ShoppingBag, 
  Home, 
  Sparkles 
} from 'lucide-react';

const industryIcons: Record<string, LucideIcon> = {
  moebel: Box,
  schmuck: Watch,
  elektronik: Smartphone,
  industrie: Settings,
  fashion: ShoppingBag,
  home: Home,
  beauty: Sparkles
};

export default function ThreeDSnapLanding() {
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "3D-Snap",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "description": "KI-gestützte Foto-zu-3D Pipeline für die Digitalisierung von Objekten."
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden">
      <JsonLd data={jsonLdData} />
      
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-zinc-900/50 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-24">
        <header className="max-w-4xl mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest text-zinc-500 uppercase mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Product-Led Growth Engine
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500"
          >
            3D-SNAP<span className="text-zinc-800 italic">.de</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-zinc-400 leading-snug max-w-2xl"
          >
            Die Bibliothek der Möglichkeiten. Wählen Sie Ihre Branche und entdecken Sie, wie schnell Ihr Inventar dreidimensional wird.
          </motion.p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[300px]">
          {Object.values(industries).map((ind, idx) => {
            const Icon = industryIcons[ind.slug] || Box;
            
            // Bento logic: Einige Karten sind breiter (Col Span)
            const isWide = idx === 0 || idx === 3;
            
            return (
              <motion.div
                key={ind.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx }}
                className={`group relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/20 backdrop-blur-xl flex flex-col p-8 transition-all hover:border-white/20 hover:bg-zinc-900/40 ${
                  isWide ? 'md:col-span-8' : 'md:col-span-4'
                }`}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-auto">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">{ind.name}</h2>
                    <p className="text-zinc-500 text-sm max-w-[250px] leading-relaxed line-clamp-2">
                      {ind.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6 mb-8">
                    {ind.categories.slice(0, 3).map(cat => (
                      <span key={cat.slug} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-400 font-medium">
                        {cat.name}
                      </span>
                    ))}
                    {ind.categories.length > 3 && (
                      <span className="px-3 py-1 rounded-full bg-transparent border border-white/5 text-[10px] text-zinc-600 font-medium">
                        +{ind.categories.length - 3}
                      </span>
                    )}
                  </div>

                  <Link 
                    href={`/3d-snap/${ind.slug}`}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors"
                  >
                    Workflow öffnen <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <footer className="mt-40 text-center py-20 border-t border-white/5">
          <p className="text-zinc-600 text-sm mb-4 uppercase tracking-[0.3em] font-bold">Infrastruktur für die Zukunft</p>
          <h3 className="text-4xl font-bold mb-12">Nicht gelistet? Wir bauen Ihre Nische.</h3>
          <Link 
            href="/contact"
            className="px-12 py-5 rounded-full bg-white text-black font-black hover:scale-105 transition-transform"
          >
            Kontakt aufnehmen
          </Link>
        </footer>
      </div>
    </div>
  );
}
