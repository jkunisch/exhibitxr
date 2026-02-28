"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Maximize, RotateCw, Move3D, Undo2, Redo2 } from "lucide-react";

interface FloatingCanvasToolbarProps {
    /** Whether auto-rotate is currently enabled. */
    autoRotate: boolean;
    /** Toggle auto-rotate on/off. */
    onToggleAutoRotate: () => void;
    /** Whether a model is currently selected for PivotControls editing. */
    isModelSelected: boolean;
    /** Toggle model selection (Gizmo) on/off. */
    onToggleGizmo: () => void;
    /** Re-fit camera to bounds. */
    onResetCamera: () => void;
    /** Whether undo is available. */
    canUndo?: boolean;
    /** Whether redo is available. */
    canRedo?: boolean;
    /** Perform undo action. */
    onUndo?: () => void;
    /** Perform redo action. */
    onRedo?: () => void;
}

const IDLE_TIMEOUT_MS = 3000;

/**
 * Floating toolbar overlay centered at the bottom of the 3D canvas.
 *
 * Actions:
 * - Auto-Rotate toggle
 * - Screenshot capture (dispatches `3dsnap:screenshot` event)
 * - Reset camera (re-fit to bounds)
 * - Toggle Gizmo (PivotControls) on/off
 *
 * UX: Fades out after 3s of inactivity, fades in on mouse move.
 */
export default function FloatingCanvasToolbar({
    autoRotate,
    onToggleAutoRotate,
    isModelSelected,
    onToggleGizmo,
    onResetCamera,
    canUndo = false,
    canRedo = false,
    onUndo,
    onRedo,
}: FloatingCanvasToolbarProps) {
    const [visible, setVisible] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetIdleTimer = useCallback(() => {
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(false), IDLE_TIMEOUT_MS);
    }, []);

    // Start idle timer on mount, reset on pointer activity
    useEffect(() => {
        resetIdleTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [resetIdleTimer]);

    const handleScreenshot = useCallback(() => {
        window.dispatchEvent(new CustomEvent("3dsnap:screenshot"));
    }, []);

    const baseActions: {
        id: string;
        icon: any;
        label: string;
        active: boolean;
        disabled?: boolean;
        onClick: () => void;
    }[] = [
            {
                id: "auto-rotate",
                icon: RotateCw,
                label: autoRotate ? "Rotation stoppen" : "Auto-Rotation",
                active: autoRotate,
                onClick: onToggleAutoRotate,
            },
            {
                id: "screenshot",
                icon: Camera,
                label: "Screenshot",
                active: false,
                onClick: handleScreenshot,
            },
            {
                id: "reset-camera",
                icon: Maximize,
                label: "Kamera zurücksetzen",
                active: false,
                onClick: onResetCamera,
            },
            {
                id: "toggle-gizmo",
                icon: Move3D,
                label: isModelSelected ? "Gizmo deaktivieren" : "Gizmo aktivieren",
                active: isModelSelected,
                onClick: onToggleGizmo,
            },
        ];

    const historyActions = [];
    if (onUndo) {
        historyActions.push({
            id: "undo",
            icon: Undo2,
            label: "Rückgängig (Ctrl+Z)",
            active: false,
            disabled: !canUndo,
            onClick: onUndo,
        });
    }
    if (onRedo) {
        historyActions.push({
            id: "redo",
            icon: Redo2,
            label: "Wiederholen (Ctrl+Shift+Z)",
            active: false,
            disabled: !canRedo,
            onClick: onRedo,
        });
    }

    const allActions = [...historyActions, ...baseActions];

    return (
        <div
            className="absolute inset-0 z-10 pointer-events-none"
            onPointerMove={resetIdleTimer}
        >
            <div
                className={`absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 py-1.5 shadow-lg backdrop-blur-xl transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"
                    }`}
                onPointerEnter={() => {
                    setVisible(true);
                    if (timerRef.current) clearTimeout(timerRef.current);
                }}
                onPointerLeave={resetIdleTimer}
            >
                {allActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            type="button"
                            onClick={action.onClick}
                            disabled={action.disabled}
                            title={action.label}
                            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed ${action.active
                                ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,170,255,0.3)]"
                                : "text-white/70 hover:text-white"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
