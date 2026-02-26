import { Timestamp } from "firebase-admin/firestore";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminDb } from "@/lib/firebaseAdmin";
import type { PlanTier } from "@/lib/planLimits";
import { getSessionUser } from "@/lib/session";
import { getTenantEntitlementSnapshot } from "@/lib/tenantEntitlements";
import StudioCard from "@/components/ui/StudioCard";
import {
  Plus,
  Settings,
  ExternalLink,
  History,
  CheckCircle2,
  Clock,
  Box
} from "lucide-react";
import SnapHandoff from "@/components/dashboard/SnapHandoff";
import { InlineDeleteButton } from "@/components/dashboard/InlineDeleteButton";

export const dynamic = "force-dynamic";

type ExhibitionListItem = {
  id: string;
  title: string;
  isPublished: boolean;
  updatedAtLabel: string;
  thumbnailUrl?: string;
  hasAR: boolean;
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

async function listTenantExhibitions(tenantId: string): Promise<ExhibitionListItem[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions")
    .limit(20)
    .get();

  const items = snapshot.docs
    .map((document) => {
      const data = document.data();
      const title =
        typeof data.title === "string" && data.title.trim().length > 0
          ? data.title
          : "Unbenanntes Projekt";

      const updatedAt =
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().getTime()
          : 0;

      // Extrahiere Model-Daten für Visuals
      const model = data.model || {};
      const thumbnailUrl = typeof model.thumbnailUrl === "string" ? model.thumbnailUrl : undefined;
      const hasAR = typeof model.usdzUrl === "string" && model.usdzUrl.length > 0;

      return {
        id: document.id,
        title,
        isPublished: data.isPublished === true,
        updatedAtLabel: formatDate(data.updatedAt),
        updatedAt,
        thumbnailUrl,
        hasAR,
      };
    })
    .sort((left, right) => right.updatedAt - left.updatedAt);

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    isPublished: item.isPublished,
    updatedAtLabel: item.updatedAtLabel,
    thumbnailUrl: item.thumbnailUrl,
    hasAR: item.hasAR,
  }));
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

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard");
  }

  const [exhibitions, entitlements] = await Promise.all([
    listTenantExhibitions(sessionUser.tenantId),
    getTenantEntitlementSnapshot(sessionUser.tenantId, sessionUser.email),
  ]);

  return (
    <div className="space-y-8">
      <SnapHandoff />
      {/* Welcome & Stats Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white">Willkommen im Studio</h2>
          <p className="mt-2 text-zinc-500 font-medium">Verwalten Sie Ihre 3D-Projekte und Ausstellungen.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Plan: {formatPlanLabel(entitlements.plan)}</p>
            <p className="text-xs font-bold text-zinc-400">
              {entitlements.currentExhibitions} / {entitlements.maxExhibitions} Modelle
            </p>
          </div>

          {entitlements.canCreateExhibition ? (
            <Link
              href="/dashboard/exhibitions/new"
              className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-black transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              <Plus size={18} />
              Neues Projekt
            </Link>
          ) : (
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-8 py-4 text-sm font-black text-amber-500 transition-colors hover:bg-amber-500/20"
            >
              Upgrade nötig
            </Link>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Main List */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700">Aktuelle Projekte</h3>
            <Link href="/dashboard/exhibitions" className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors">Alle ansehen</Link>
          </div>

          {exhibitions.length === 0 ? (
            <StudioCard className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Box size={32} className="text-zinc-700" />
              </div>
              <p className="text-zinc-500 font-medium">Noch keine Ausstellungen vorhanden.</p>
              <Link href="/dashboard/exhibitions/new" className="mt-4 text-xs font-bold text-white underline">Jetzt die erste erstellen</Link>
            </StudioCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {exhibitions.map((item, idx) => (
                <StudioCard key={item.id} delay={idx * 0.05} className="group p-0 overflow-hidden flex flex-col h-full">
                  <div className="relative aspect-video bg-black/40 flex items-center justify-center border-b border-white/5 overflow-hidden">
                    <Link href={`/dashboard/editor/${item.id}`} className="absolute inset-0 z-10" aria-label={item.title} />
                    
                    {item.thumbnailUrl ? (
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.title} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <Box size={48} className="text-zinc-800 group-hover:text-zinc-600 transition-colors" />
                    )}

                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${item.isPublished
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-zinc-900/60 text-zinc-500 border border-white/10'
                        }`}>
                        {item.isPublished ? 'Live' : 'Draft'}
                      </span>
                      {item.hasAR && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#00aaff]/20 text-[#00aaff] border border-[#00aaff]/30 backdrop-blur-md">
                          AR Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white leading-tight group-hover:text-[#00aaff] transition-colors">{item.title}</h4>
                        <p className="text-[10px] text-zinc-500 font-medium mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                          <Clock size={10} /> {item.updatedAtLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                      <Link
                        href={`/dashboard/editor/${item.id}`}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-center text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
                      >
                        Editor
                      </Link>
                      <Link
                        href={`/dashboard/exhibitions/${item.id}`}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-colors"
                        title="Einstellungen"
                      >
                        <Settings size={14} />
                      </Link>
                      <InlineDeleteButton exhibitionId={item.id} tenantId={sessionUser.tenantId} />
                    </div>
                  </div>
                </StudioCard>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info / Activity */}
        <div className="md:col-span-4 space-y-6">
          <div className="px-2 mb-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700">Aktivität</h3>
          </div>

          <StudioCard className="p-8">
            <History size={24} className="text-zinc-700 mb-6" />
            <h4 className="text-lg font-bold mb-2">Letzte Änderungen</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Hier werden bald Ihre letzten Studio-Aktionen und Modell-Updates gelistet.
            </p>
          </StudioCard>

          <StudioCard className="p-8 bg-zinc-900/40 border-white/10">
            <CheckCircle2 size={24} className="text-green-500 mb-6" />
            <h4 className="text-lg font-bold mb-2">Studio Status</h4>
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Meshy Engine</span>
                <span className="text-green-500 font-bold uppercase tracking-widest text-[9px]">Operational</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Viewer CDN</span>
                <span className="text-green-500 font-bold uppercase tracking-widest text-[9px]">Optimal</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Storage Quota</span>
                <span className="text-zinc-300 font-bold uppercase tracking-widest text-[9px]">Healthy</span>
              </div>
            </div>
          </StudioCard>
        </div>

      </div>
    </div>
  );
}
