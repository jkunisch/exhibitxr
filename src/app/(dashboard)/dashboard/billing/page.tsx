import Link from "next/link";
import { redirect } from "next/navigation";

import BillingPlans from "@/components/ui/BillingPlans";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getPlanLimits, type PlanTier } from "@/lib/planLimits";
import { getSessionUser } from "@/lib/session";

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
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">Billing</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Tenant Subscription</h2>
            <p className="mt-1 text-sm text-white/70">
              Current plan: <span className="font-medium uppercase">{currentPlan}</span>
            </p>
          </div>
          <Link
            href="/dashboard/exhibitions"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
          >
            Back to Exhibitions
          </Link>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/75">
          Plan limits: {currentLimits.exhibitions} exhibitions, {currentLimits.storageMb} MB
          storage, {currentLimits.viewsPerMonth} views/month.
        </div>
      </div>

      <BillingPlans currentPlan={currentPlan} />
    </section>
  );
}
