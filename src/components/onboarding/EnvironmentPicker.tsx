'use client';

import React, { useRef } from 'react';

export const ENVIRONMENTS = [
    { id: 'studio', label: 'Studio', gradient: 'from-neutral-200 to-neutral-400' },
    { id: 'city', label: 'City', gradient: 'from-blue-900 to-slate-800' },
    { id: 'sunset', label: 'Sunset', gradient: 'from-orange-500 to-purple-700' },
    { id: 'warehouse', label: 'Warehouse', gradient: 'from-stone-700 to-stone-900' },
    { id: 'forest', label: 'Forest', gradient: 'from-emerald-800 to-green-950' },
    { id: 'apartment', label: 'Apartment', gradient: 'from-amber-100 to-orange-200' },
];

interface EnvironmentPickerProps {
    selected: string;
    onSelect: (preset: string) => void;
}

export function EnvironmentPicker({ selected, onSelect }: EnvironmentPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let nextIndex = index;
        if (e.key === 'ArrowRight') nextIndex = Math.min(index + 1, ENVIRONMENTS.length - 1);
        else if (e.key === 'ArrowLeft') nextIndex = Math.max(index - 1, 0);
        else if (e.key === 'ArrowDown') nextIndex = Math.min(index + 3, ENVIRONMENTS.length - 1);
        else if (e.key === 'ArrowUp') nextIndex = Math.max(index - 3, 0);
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(ENVIRONMENTS[index].id);
            return;
        }

        if (nextIndex !== index) {
            e.preventDefault();
            const buttons = containerRef.current?.querySelectorAll('button');
            buttons?.[nextIndex]?.focus();
        }
    };

    return (
        <div ref={containerRef} className="grid grid-cols-3 sm:grid-cols-6 gap-3" role="radiogroup" aria-label="Umgebung auswählen">
            {ENVIRONMENTS.map((env, index) => {
                const isSelected = selected === env.id;
                return (
                    <button
                        key={env.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={env.label}
                        tabIndex={isSelected ? 0 : (index === 0 && !selected ? 0 : -1)}
                        onClick={() => onSelect(env.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={`group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white
              ${isSelected ? 'scale-105 shadow-[0_0_15px_rgba(0,170,255,0.4)] ring-2 ring-[#00aaff] z-10' : 'hover:scale-105 ring-1 ring-white/10 hover:ring-white/30'}
            `}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${env.gradient}`} />
                        <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                    </button>
                );
            })}
        </div>
    );
}
