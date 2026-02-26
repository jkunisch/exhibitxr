"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteExhibitionAction } from "@/app/actions/exhibitions";

interface Props {
    exhibitionId: string;
    tenantId: string;
}

export function InlineDeleteButton({ exhibitionId, tenantId }: Props) {
    const router = useRouter();
    const [confirm, setConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    if (confirm) {
        return (
            <div className="flex items-center gap-1.5 z-10 relative">
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
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
                            setConfirm(false);
                        });
                    }}
                    className="px-3 py-1.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                >
                    {isPending ? "..." : "Ja"}
                </button>
                <button
                    type="button"
                    onClick={() => setConfirm(false)}
                    className="px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                    Nein
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setConfirm(true)}
            className="p-3 rounded-full bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 text-red-400/50 hover:text-red-400 transition-colors z-10 relative"
            title="Löschen"
        >
            <Trash2 size={16} />
        </button>
    );
}
