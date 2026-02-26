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

      return {
        id: document.id,
        title,
        isPublished: data.isPublished === true,
        updatedAtLabel: formatDate(data.updatedAt),
        updatedAt,
      };
    })
    .sort((left, right) => right.updatedAt - left.updatedAt);

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    isPublished: item.isPublished,
    updatedAtLabel: item.updatedAtLabel,
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
            <div className="grid grid-cols-1 gap-4">
              {exhibitions.map((item, idx) => (
                <StudioCard key={item.id} delay={idx * 0.05} className="group p-0 overflow-hidden">
                  <div className="relative flex items-center p-6 gap-6">
                    <Link href={`/dashboard/editor/${item.id}`} className="absolute inset-0 z-0" aria-label={item.title} />
                    <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-colors shrink-0">
                      <Box size={24} className="text-zinc-700 group-hover:text-zinc-300 transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-bold text-white truncate">{item.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.isPublished
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                          }`}>
                          {item.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {item.updatedAtLabel}</span>
                        <span className="hidden sm:inline text-zinc-700">ID: {item.id}</span>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                      <Link
                        href={`/dashboard/exhibitions/${item.id}`}
                        className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        title="Einstellungen"
                      >
                        <Settings size={16} />
                      </Link>
                      <InlineDeleteButton exhibitionId={item.id} tenantId={sessionUser.tenantId} />
                      <div className="p-3 rounded-full bg-white text-black transition-transform hover:scale-110">
                        <ExternalLink size={16} />
                      </div>
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
