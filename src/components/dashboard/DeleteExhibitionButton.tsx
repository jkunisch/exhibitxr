"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { deleteExhibitionAction } from "@/app/actions/exhibitions";

interface DeleteExhibitionButtonProps {
    exhibitionId: string;
    tenantId: string;
    exhibitionTitle: string;
}

export function DeleteExhibitionButton({
    exhibitionId,
    tenantId,
    exhibitionTitle,
}: DeleteExhibitionButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = useCallback(() => {
        startTransition(async () => {
            const fd = new FormData();
            fd.set("exhibitionId", exhibitionId);
            fd.set("tenantId", tenantId);

            const result = await deleteExhibitionAction(fd);
            if (result.ok) {
                router.refresh();
            } else {
                alert(`Fehler: ${result.error}`);
            }
            setShowConfirm(false);
        });
    }, [exhibitionId, tenantId, router]);

    if (showConfirm) {
        return (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 w-full animate-in fade-in zoom-in duration-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">
                    Löschen?
                </span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-105 disabled:opacity-50"
                    >
                        {isPending ? "..." : "Ja"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Nein
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all group"
        >
            <Trash2 size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            Projekt löschen
        </button>
    );
}
