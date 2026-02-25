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
            <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="text-rose-300">
                    &quot;{exhibitionTitle}&quot; löschen?
                </span>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="rounded-lg border border-rose-400/40 bg-rose-500/20 px-2.5 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50 cursor-pointer"
                >
                    {isPending ? "…" : "Ja"}
                </button>
                <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/15 cursor-pointer"
                >
                    Nein
                </button>
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 cursor-pointer"
        >
            <Trash2 className="h-3.5 w-3.5" />
            Löschen
        </button>
    );
}
