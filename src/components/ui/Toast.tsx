'use client';

import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface ToastStore {
    message: string | null;
    showToast: (msg: string) => void;
    hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => {
    let timeoutId: NodeJS.Timeout;

    return {
        message: null,
        showToast: (msg) => {
            set({ message: msg });
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                set({ message: null });
            }, 3000);
        },
        hideToast: () => {
            set({ message: null });
            if (timeoutId) clearTimeout(timeoutId);
        },
    };
});

export function ToastProvider() {
    const { message } = useToastStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    className="fixed bottom-8 left-1/2 z-[9999] flex items-center gap-2 px-6 py-3 bg-[#1a1a24] text-white border border-white/10 text-sm font-medium rounded-full shadow-[0_8px_32px_rgba(0,170,255,0.15)]"
                >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {message}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
