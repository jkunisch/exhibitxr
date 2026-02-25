'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Advanced Background Effects: Living Deep Space.
 * Fixes Hydration Mismatch by generating random particles only on the client.
 */
export default function BackgroundEffects() {
  const [isMounted, setIsMounted] = useState(false);

  const [particles, setParticles] = useState<Array<{x: string, y: string, opacity: number, duration: number, delay: number}>>([]);

  useEffect(() => {
    // Generate particle configs once on the client
    const generatedParticles = [...Array(20)].map(() => ({
      x: Math.random() * 100 + "%",
      y: Math.random() * 100 + "%",
      opacity: Math.random() * 0.3,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 10
    }));
    setTimeout(() => {
      setParticles(generatedParticles);
      setIsMounted(true);
    }, 0);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-[#010102]">
      {/* The Grid - Subtle blueprint feel */}
      <div className="absolute inset-0 opacity-[0.12]" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '60px 60px' 
        }} 
      />
      
      {/* Ambient Floating Particles (Stardust) - Only rendered on client */}
      <div className="absolute inset-0">
        {isMounted && particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ 
              x: p.x, 
              y: p.y,
              opacity: p.opacity
            }}
            animate={{ 
              y: ["-10%", "110%"],
              opacity: [0, 0.3, 0]
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity, 
              ease: "linear",
              delay: p.delay
            }}
            style={{ filter: 'blur(1px)' }}
          />
        ))}
      </div>

      {/* Pulsating Nebulas - Vibrant color shifts */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.08, 0.05]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#00aaff] rounded-full blur-[180px]" 
      />
      
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.03, 0.06, 0.03]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#8b5cf6] rounded-full blur-[180px]" 
      />

      {/* Vertical Scanning Beam - Very subtle motion */}
      <motion.div 
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-[400px] bg-gradient-to-b from-transparent via-[#00aaff]/[0.02] to-transparent pointer-events-none"
      />
    </div>
  );
}
