"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-500 ${
        isScrolled 
          ? "bg-zinc-950/80 backdrop-blur-2xl border border-white/10 py-3 rounded-2xl md:rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
          : "bg-black/20 backdrop-blur-sm border border-white/5 py-4 rounded-2xl md:rounded-[2.5rem]"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <Link href="/">
              <Logo className="h-20 md:h-32" showText={false} />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Link href="#features" className="text-zinc-400 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors">
              Funktionen
            </Link>
            <Link href="#usecases" className="text-zinc-400 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors">
              Showcase
            </Link>
            <Link href="#pricing" className="text-zinc-400 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors">
              Preise
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              <LayoutDashboard size={14} />
              Studio
            </Link>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 mt-4 px-4 md:hidden"
          >
            <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl backdrop-blur-3xl">
              <div className="flex flex-col gap-4">
                <Link href="#features" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-zinc-400">Funktionen</Link>
                <Link href="#usecases" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-zinc-400">Showcase</Link>
                <Link href="#pricing" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-zinc-400">Preise</Link>
                <div className="h-px bg-white/5 my-2" />
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest">
                  Studio öffnen
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
