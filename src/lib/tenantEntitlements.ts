import "server-only";

import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  canCreateExhibition,
  getPlanLimits,
  normalizePlan,
  type PlanTier,
} from "@/lib/planLimits";

export type TenantEntitlementSnapshot = {
  plan: PlanTier;
  currentExhibitions: number;
  maxExhibitions: number;
  canCreateExhibition: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

async function getTenantPlan(tenantId: string): Promise<PlanTier> {
  const snapshot = await getAdminDb().collection("tenants").doc(tenantId).get();
  const data = asRecord(snapshot.data());

  return normalizePlan(data?.plan);
}

async function getTenantExhibitionCount(tenantId: string): Promise<number> {
  const exhibitionsCollection = getAdminDb()
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions");

  try {
    const countSnapshot = await exhibitionsCollection.count().get();
    const count = countSnapshot.data().count;

    if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
      return count;
    }
  } catch {
    const fallbackSnapshot = await exhibitionsCollection.limit(1000).get();
    return fallbackSnapshot.size;
  }

  return 0;
}

export async function getTenantEntitlementSnapshot(
  tenantId: string,
  email?: string | null,
): Promise<TenantEntitlementSnapshot> {
  const [plan, currentExhibitions] = await Promise.all([
    getTenantPlan(tenantId),
    getTenantExhibitionCount(tenantId),
  ]);

  const limits = getPlanLimits(plan);

  return {
    plan,
    currentExhibitions,
    maxExhibitions: limits.exhibitions,
    canCreateExhibition: canCreateExhibition(plan, currentExhibitions, email),
  };
}
