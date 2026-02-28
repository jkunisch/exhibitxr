"use client";

import { useCallback, useRef, useState, useEffect } from "react";

interface PremiumSliderProps {
    /** Current value. */
    value: number;
    /** Called when value changes. */
    onChange: (value: number) => void;
    /** Minimum value. */
    min: number;
    /** Maximum value. */
    max: number;
    /** Step increment. */
    step?: number;
    /** Format the tooltip value (e.g. add "°" suffix). */
    formatValue?: (value: number) => string;
}

/**
 * Premium range slider with:
 * - Gradient track (dark → cyan → bright)
 * - Glowing thumb with box-shadow
 * - Hover-tooltip showing the current value
 * - Smooth transitions
 */
export default function PremiumSlider({
    value,
    onChange,
    min,
    max,
    step = 0.01,
    formatValue,
}: PremiumSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    const displayValue = formatValue ? formatValue(value) : value.toFixed(1);

    const updateValueFromPointer = useCallback(
        (clientX: number) => {
            const track = trackRef.current;
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const rawPercent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const rawValue = min + rawPercent * (max - min);
            // Snap to step
            const snapped = Math.round(rawValue / step) * step;
            // Clamp to range
            const clamped = Math.max(min, Math.min(max, snapped));
            onChange(clamped);
        },
        [min, max, step, onChange],
    );

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setIsDragging(true);
            updateValueFromPointer(e.clientX);
        },
        [updateValueFromPointer],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging) return;
            updateValueFromPointer(e.clientX);
        },
        [isDragging, updateValueFromPointer],
    );

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Keyboard support (left/right arrows)
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            let newValue = value;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                newValue = Math.min(max, value + step);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                newValue = Math.max(min, value - step);
            } else if (e.key === "Home") {
                newValue = min;
            } else if (e.key === "End") {
                newValue = max;
            } else {
                return;
            }
            e.preventDefault();
            onChange(Math.round(newValue / step) * step);
        },
        [value, min, max, step, onChange],
    );

    const showTooltip = isDragging || isHovering;

    return (
        <div
            className="relative flex items-center py-2"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Track */}
            <div
                ref={trackRef}
                role="slider"
                tabIndex={0}
                aria-valuenow={value}
                aria-valuemin={min}
                aria-valuemax={max}
                className="relative h-2 w-full cursor-pointer rounded-full bg-white/10"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={handleKeyDown}
            >
                {/* Filled track with gradient */}
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-600/80 via-cyan-400 to-cyan-200 transition-[width] duration-75"
                    style={{ width: `${percent}%` }}
                />

                {/* Thumb */}
                <div
                    className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 bg-white transition-shadow duration-150 ${isDragging
                            ? "shadow-[0_0_14px_rgba(0,170,255,0.7)] scale-110"
                            : "shadow-[0_0_8px_rgba(0,170,255,0.4)]"
                        }`}
                    style={{ left: `${percent}%` }}
                />

                {/* Value tooltip */}
                <div
                    className={`absolute -top-8 -translate-x-1/2 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-cyan-200 backdrop-blur-sm transition-opacity duration-150 whitespace-nowrap ${showTooltip ? "opacity-100" : "opacity-0"
                        }`}
                    style={{ left: `${percent}%` }}
                >
                    {displayValue}
                </div>
            </div>
        </div>
    );
}
