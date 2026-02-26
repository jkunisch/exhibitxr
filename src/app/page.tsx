'use client';

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Camera, 
  Palette, 
  MapPin, 
  Link2, 
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Sparkles,
  Check
} from "lucide-react";
import HomeSnapModule from "@/components/ui/HomeSnapModule";
import Navbar from "@/components/ui/Navbar";
import StudioCard from "@/components/ui/StudioCard";
import BackgroundEffects from "@/components/ui/BackgroundEffects";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#010102] text-white selection:bg-[#00aaff]/30 overflow-x-hidden">
      <BackgroundEffects />
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-[#00aaff] uppercase mb-12 backdrop-blur-md"
          >
            <Sparkles size={12} className="animate-pulse" />
            Snap. Generieren. Teilen.
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter mb-10 leading-[1.1] pt-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40"
          >
            REALITÄT <br /> <span className="text-[#00aaff] drop-shadow-[0_0_40px_rgba(0,170,255,0.4)] uppercase tracking-tighter">SNAPPEN</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-16 max-w-2xl mx-auto leading-tight font-medium"
          >
            Vom Foto zum fertigen 3D-Asset in Sekunden. <br className="hidden md:block" />
            Einfach. Schnell. Für alle Anwendungsbereiche.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-8 mb-24"
          >
            <Link
              href="/register"
              className="group relative px-14 py-7 bg-white text-black text-sm font-black uppercase tracking-widest rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.1)] overflow-hidden flex items-center gap-3"
            >
              <span className="relative z-10">ZUM STUDIO</span>
              <ArrowUpRight size={18} className="relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
          </motion.div>

          {/* 3D Snap Module - FLUID BORDER UPGRADE */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative mx-auto w-full max-w-5xl rounded-[3.5rem] p-[2px] overflow-hidden group shadow-[0_0_100px_rgba(0,170,255,0.15)]"
          >
            {/* Fluid Magic Border (Animated Conic Gradient with Rainbow Hue Shift) */}
            <motion.div 
              className="absolute inset-[-500%] animate-[spin_6s_linear_infinite]"
              animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #00aaff 50%, transparent 60%, transparent 100%)',
              }}
            />
            
            <div className="relative rounded-[3.4rem] overflow-hidden border border-white/5 bg-[#050507] backdrop-blur-3xl min-h-[550px]">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />
              <div className="relative z-10">
                <HomeSnapModule />
              </div>

              <div className="absolute top-8 right-8 z-20 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-[#00aaff] rounded-full animate-pulse shadow-[0_0_10px_#00aaff]" />
                3D-Snap Core Engine
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="usecases" className="py-40 bg-white text-black rounded-[5rem] mx-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-end justify-between gap-12 mb-32 text-left">
            <div className="max-w-2xl">
              <h2 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-300 mb-8">Referenzen</h2>
              <h3 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase">Anwendungs<br />bereiche<span className="text-[#00aaff]">.</span></h3>
            </div>
            <Link href="/3d-snap" className="group flex items-center gap-6 text-sm font-black uppercase tracking-[0.4em] transition-all hover:gap-8">
              Bibliothek öffnen <ArrowUpRight size={24} className="text-[#00aaff]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Möbel", 
                desc: "Premium Präsentation", 
                img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop" 
              },
              { 
                title: "Industrie", 
                desc: "Präzision & Technik", 
                img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop" 
              },
              { 
                title: "Kreative", 
                desc: "Builder & Artists", 
                img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop" 
              }
            ].map((item, idx) => (
              <div key={idx} className="group relative rounded-[3rem] overflow-hidden aspect-[4/5] md:aspect-[10/14] bg-zinc-100 shadow-xl">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-500" />
                <div className="absolute bottom-10 left-10 text-white drop-shadow-lg">
                  <h4 className="text-3xl font-black mb-2 uppercase tracking-tighter">{item.title}</h4>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-28 md:py-40">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-8 text-xs font-black uppercase tracking-[0.6em] text-[#00aaff]">PREISE</h2>
          <h3 className="mb-20 text-5xl font-black tracking-tighter md:text-7xl lg:text-[6rem]">TARIFE.</h3>

          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:[grid-auto-rows:1fr]">
            {/* Free / Trial */}
            <StudioCard className="flex h-full flex-col border-white/10 bg-zinc-950/70 p-8 text-left sm:p-10">
              <div className="flex-1">
                <h4 className="mb-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Trial</h4>
                <div className="mb-8 text-5xl font-black tracking-tighter text-white">
                  0€<span className="ml-2 text-xs text-zinc-500">/ MONAT</span>
                </div>
                <ul className="space-y-4 text-sm font-semibold text-zinc-300">
                  <li className="flex items-center gap-3"><Check size={16} className="text-[#00aaff]" /> 5 Credits inklusive</li>
                  <li className="flex items-center gap-3 text-zinc-500"><Check size={16} /> ~1 Premium Snap zum Testen</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-zinc-500" /> Unlimitierte Projekte</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-10 w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:border-[#00aaff]/60 hover:bg-[#00aaff]/15"
              >
                GET STARTED
              </Link>
            </StudioCard>

            {/* Creator / Starter */}
            <StudioCard className="relative z-10 flex h-full flex-col border-[#00aaff]/40 bg-[#03111a]/90 p-8 text-left ring-1 ring-[#00aaff]/30 sm:p-10">
              <div className="absolute right-6 top-6 rounded-full bg-[#00aaff] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Creator
              </div>
              <div className="flex-1 pr-16">
                <h4 className="mb-5 text-[10px] font-black uppercase tracking-widest text-[#00aaff]">Starter</h4>
                <div className="mb-8 text-5xl font-black tracking-tighter text-white">
                  19€<span className="ml-2 text-xs text-[#00aaff]">/ MONAT</span>
                </div>
                <ul className="space-y-4 text-sm font-semibold text-zinc-100">
                  <li className="flex items-center gap-3"><Check size={16} className="text-[#00aaff]" /> 20 Credits / Monat</li>
                  <li className="flex items-center gap-3 text-zinc-400"><Check size={16} /> ~6 Premium Snaps</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-[#00aaff]" /> Unlimitierte Projekte</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-[#00aaff]" /> Kommerzielle Nutzung</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-10 w-full rounded-2xl bg-white px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_0_30px_rgba(255,255,255,0.18)] transition-all hover:scale-[1.01]"
              >
                START STUDIO
              </Link>
            </StudioCard>

            {/* Studio / Pro */}
            <StudioCard className="flex h-full flex-col border-white/10 bg-zinc-950/70 p-8 text-left sm:p-10">
              <div className="flex-1">
                <h4 className="mb-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Studio</h4>
                <div className="mb-8 text-5xl font-black tracking-tighter text-white">
                  49€<span className="ml-2 text-xs text-zinc-500">/ MONAT</span>
                </div>
                <ul className="space-y-4 text-sm font-semibold text-zinc-300">
                  <li className="flex items-center gap-3"><Check size={16} className="text-zinc-500" /> 60 Credits / Monat</li>
                  <li className="flex items-center gap-3 text-zinc-600"><Check size={16} /> ~20 Premium Snaps</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-zinc-500" /> Unlimitierte Projekte</li>
                  <li className="flex items-center gap-3"><Check size={16} className="text-zinc-500" /> Priorität & Support</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-10 w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:border-white/30 hover:bg-white hover:text-black"
              >
                STUDIO STARTEN
              </Link>
            </StudioCard>
          </div>
          
          <p className="mt-12 text-xs font-medium text-zinc-500">
            * 1 Credit = 1 Basic Snap (Tripo AI). 3 Credits = 1 Premium Snap (Meshy AI, PBR & High-Fidelity).
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-black pt-48 pb-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start mb-32 gap-24 text-left">
            <div className="max-w-sm">
              <Link href="/" className="text-3xl font-black tracking-tighter text-white mb-10 block">
                3D-SNAP<span className="text-[#00aaff] italic">.de</span>
              </Link>
              <p className="text-zinc-600 text-lg leading-relaxed font-medium">
                Das schnellste 3D-Studio für Creator & Brands. 
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-24">
              <div className="flex flex-col gap-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Produkt</h5>
                <Link href="/3d-snap" className="text-zinc-500 hover:text-[#00aaff] text-xs font-bold transition-colors">Bibliothek</Link>
                <Link href="/was-ist-3d-snap" className="text-zinc-500 hover:text-[#00aaff] text-xs font-bold transition-colors">Technologie</Link>
                <Link href="/dashboard" className="text-zinc-500 hover:text-[#00aaff] text-xs font-bold transition-colors">Studio</Link>
              </div>
              <div className="flex flex-col gap-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Rechtliches</h5>
                <Link href="/impressum" className="text-zinc-500 hover:text-white text-xs font-bold transition-colors">Impressum</Link>
                <Link href="/datenschutz" className="text-zinc-500 hover:text-white text-xs font-bold transition-colors">Datenschutz</Link>
                <Link href="/agb" className="text-zinc-500 hover:text-white text-xs font-bold transition-colors">AGB</Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-12 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">
            <span>&copy; 2026 ExhibitXR &middot; Build 0.4.9</span>
            <div className="flex gap-12 mt-8 md:mt-0">
               <span className="flex items-center gap-3"><ShieldCheck size={14} className="text-[#00aaff]" /> Sicherer Speicher</span>
               <span className="flex items-center gap-3 tracking-[0.5em]">Berlin &middot; Mannheim</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
