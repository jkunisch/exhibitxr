import { Timestamp } from "firebase-admin/firestore";
import { Download, Pencil, ChevronLeft, Plus, Box, ExternalLink, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteExhibitionButton } from "@/components/dashboard/DeleteExhibitionButton";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { PlanTier } from "@/lib/planLimits";
import { getSessionUser } from "@/lib/session";
import {
  type TenantEntitlementSnapshot,
  getTenantEntitlementSnapshot,
} from "@/lib/tenantEntitlements";
import StudioCard from "@/components/ui/StudioCard";

export const dynamic = "force-dynamic";

type ExhibitionsPageSearchParams = Promise<{
  deleted?: string | string[];
}>;

type ExhibitionListItem = {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  environment: string;
  updatedAtMs: number;
  updatedAtLabel: string;
  glbUrl: string | null;
};

function formatDate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString("de-DE");
  }

  if (value instanceof Date) {
    return value.toLocaleString("de-DE");
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("de-DE");
    }
  }

  return "No timestamp";
}

function getDateMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  return 0;
}

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

async function listTenantExhibitions(
  tenantId: string,
): Promise<ExhibitionListItem[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions")
    .limit(100)
    .get();

  const items = snapshot.docs
    .map((document) => {
      const data = document.data();

      return {
        id: document.id,
        title: asNonEmptyString(data.title, "Unbenanntes Projekt"),
        description: asNonEmptyString(data.description, "Keine Beschreibung"),
        isPublished: data.isPublished === true,
        environment: asNonEmptyString(data.environment, "studio"),
        updatedAtMs: getDateMillis(data.updatedAt),
        updatedAtLabel: formatDate(data.updatedAt),
        glbUrl: typeof data.model?.glbUrl === "string" ? data.model.glbUrl
          : typeof data.glbUrl === "string" ? data.glbUrl
            : null,
      };
    })
    .sort((left, right) => right.updatedAtMs - left.updatedAtMs);

  return items;
}

function wasDeleted(value: string | string[] | undefined): boolean {
  return value === "1";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unbekannter Fehler beim Laden der Ausstellungen.";
}

function formatPlanLabel(plan: PlanTier): string {
  switch (plan) {
    case "free": return "Free";
    case "starter": return "Starter";
    case "pro": return "Pro";
    case "enterprise": return "Enterprise";
    default: return "Free";
  }
}

export default async function ExhibitionsPage({
  searchParams,
}: {
  searchParams: ExhibitionsPageSearchParams;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard/exhibitions");
  }

  const resolvedSearchParams = await searchParams;
  const showDeletedBanner = wasDeleted(resolvedSearchParams.deleted);

  let exhibitions: ExhibitionListItem[] = [];
  let entitlements: TenantEntitlementSnapshot | null = null;
  let errorMessage: string | null = null;

  try {
    [exhibitions, entitlements] = await Promise.all([
      listTenantExhibitions(sessionUser.tenantId),
      getTenantEntitlementSnapshot(sessionUser.tenantId),
    ]);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white">Modelle</h2>
          <p className="mt-2 text-zinc-500 font-medium">Verwalten Sie Ihre gesamte 3D-Bibliothek.</p>
        </div>
        <div className="flex items-center gap-3">
            <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            >
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Zurück
            </Link>
            
            {entitlements?.canCreateExhibition ? (
              <Link
                href="/dashboard/exhibitions/new"
                className="flex items-center gap-2 rounded-full bg-white px-8 py-3 text-xs font-black text-black transition-transform hover:scale-105 active:scale-95"
              >
                <Plus size={16} />
                Projekt
              </Link>
            ) : (
              <Link
                href="/dashboard/billing"
                className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-8 py-3 text-xs font-black text-amber-500 transition-colors hover:bg-amber-500/20"
              >
                Upgrade
              </Link>
            )}
        </div>
      </div>

      {showDeletedBanner && (
        <StudioCard className="p-4 bg-green-500/5 border-green-500/20 text-green-500 text-sm font-bold text-center">
           Projekt erfolgreich gelöscht.
        </StudioCard>
      )}

      {errorMessage ? (
        <StudioCard className="p-10 flex flex-col items-center justify-center text-center">
          <p className="text-red-500 font-bold mb-4">{errorMessage}</p>
          <Link
            href="/dashboard/exhibitions"
            className="text-xs font-black uppercase tracking-widest underline text-zinc-500 hover:text-white"
          >
            Erneut versuchen
          </Link>
        </StudioCard>
      ) : exhibitions.length === 0 ? (
        <StudioCard className="flex flex-col items-center justify-center py-20 text-center">
          <Box size={48} className="text-zinc-800 mb-6" />
          <p className="text-zinc-500 font-medium">Noch keine Ausstellungen vorhanden.</p>
          <Link href="/dashboard/exhibitions/new" className="mt-4 text-xs font-bold text-white underline">Jetzt die erste erstellen</Link>
        </StudioCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map((item, idx) => (
            <StudioCard key={item.id} delay={idx * 0.05} className="group p-0 overflow-hidden flex flex-col">
              <div className="aspect-[16/9] bg-black/40 border-b border-white/5 flex items-center justify-center relative group-hover:bg-black/20 transition-colors">
                 <Box size={48} className="text-zinc-800 group-hover:scale-110 group-hover:text-zinc-700 transition-all duration-500" />
                 <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.isPublished 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                 </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                 <h4 className="text-2xl font-black tracking-tight text-white mb-2 truncate">{item.title}</h4>
                 <p className="text-xs text-zinc-500 font-medium mb-8 line-clamp-2 leading-relaxed">{item.description}</p>
                 
                 <div className="mt-auto space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-700">
                        <span>Env: {item.environment}</span>
                        <span>{item.updatedAtLabel}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <Link 
                          href={`/dashboard/editor/${item.id}`}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[1.02]"
                       >
                          <Pencil size={12} /> Edit
                       </Link>
                       <Link 
                          href={`/dashboard/exhibitions/${item.id}`}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                       >
                          <Settings size={12} /> Settings
                       </Link>
                    </div>

                    {item.glbUrl && (
                        <a
                           href={item.glbUrl}
                           download={`${item.title.replace(/\s+/g, "_")}.glb`}
                           className="flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors w-full"
                        >
                           <Download size={12} /> Download GLB
                        </a>
                    )}
                    
                    <div className="pt-2">
                        <DeleteExhibitionButton
                            exhibitionId={item.id}
                            tenantId={sessionUser.tenantId}
                            exhibitionTitle={item.title}
                        />
                    </div>
                 </div>
              </div>
            </StudioCard>
          ))}
        </div>
      )}
    </div>
  );
}
