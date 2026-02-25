'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StudioCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

/**
 * High-end Studio Card for ExhibitXR Dashboard.
 * Obsidian glass effect with subtle border glow.
 */
export default function StudioCard({ children, className, hover = true, delay = 0 }: StudioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative isolate rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-2xl p-6 transition-all duration-500",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none before:-z-10",
        hover && "hover:border-white/20 hover:shadow-[0_0_40px_rgba(0,170,255,0.05)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
