import Link from "next/link";
import { redirect } from "next/navigation";

import BillingPlans from "@/components/ui/BillingPlans";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getPlanLimits, type PlanTier } from "@/lib/planLimits";
import { getSessionUser } from "@/lib/session";
import StudioCard from "@/components/ui/StudioCard";
import { ChevronLeft, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

function normalizeTenantPlan(value: unknown): PlanTier {
  if (
    value === "free" ||
    value === "starter" ||
    value === "pro" ||
    value === "enterprise"
  ) {
    return value;
  }

  return "free";
}

export default async function BillingPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard/billing");
  }

  const tenantSnapshot = await getAdminDb()
    .collection("tenants")
    .doc(sessionUser.tenantId)
    .get();
  const currentPlan = normalizeTenantPlan(tenantSnapshot.data()?.plan);
  const currentLimits = getPlanLimits(currentPlan);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white">Abrechnung</h2>
          <p className="mt-2 text-zinc-500 font-medium">Verwalten Sie Ihr Abonnement und Studio-Limits.</p>
        </div>
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Zurück
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <StudioCard className="md:col-span-12 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <CreditCard size={24} className="text-zinc-500" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Aktueller Plan</p>
                <h3 className="text-3xl font-black uppercase tracking-tight text-white">{currentPlan}</h3>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-8 text-center md:text-left">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Projekte</p>
                <p className="text-sm font-bold text-zinc-300">{currentLimits.exhibitions}</p>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Storage</p>
                <p className="text-sm font-bold text-zinc-300">{currentLimits.storageMb} MB</p>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Views / Monat</p>
                <p className="text-sm font-bold text-zinc-300">{currentLimits.viewsPerMonth.toLocaleString()}</p>
             </div>
          </div>
        </StudioCard>
      </div>

      <div className="mt-12">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700 px-2 mb-8">Studio Pläne</h3>
        <BillingPlans currentPlan={currentPlan} />
      </div>
    </div>
  );
}
