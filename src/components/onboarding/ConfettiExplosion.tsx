'use client';

import React, { useEffect, useState } from 'react';

const COLORS = ['#00aaff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'];

interface Particle {
    id: number;
    color: string;
    tx: number;
    ty: number;
    rot: number;
    delay: number;
    duration: number;
}

export function ConfettiExplosion() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const generated = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            tx: (Math.random() - 0.5) * 600,
            ty: Math.random() * 400 + 100,
            rot: Math.random() * 720 - 360,
            delay: Math.random() * 0.4,
            duration: 1 + Math.random() * 1.5,
        }));

        setParticles(generated);
        const timer = setTimeout(() => setParticles([]), 3000);

        return () => clearTimeout(timer);
    }, []);

    if (particles.length === 0) return null;

    return (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="absolute block h-3 w-3 rounded-sm opacity-0"
                    style={{
                        backgroundColor: p.color,
                        animation: `confetti-${p.id} ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
                        '--tx': `${p.tx}px`,
                        '--ty': `${p.ty}px`,
                        '--rot': `${p.rot}deg`,
                    } as React.CSSProperties}
                />
            ))}
            <style>{`
        ${particles.map(p => `
          @keyframes confetti-${p.id} {
            0% { opacity: 1; transform: translate3d(0, 0, 0) rotateZ(0deg) scale(1); }
            100% { opacity: 0; transform: translate3d(var(--tx), var(--ty), 0) rotateZ(var(--rot)) scale(0.8); }
          }
        `).join('\n')}
      `}</style>
        </div>
    );
}
