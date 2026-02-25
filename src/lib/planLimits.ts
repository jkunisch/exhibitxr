import type { Tenant } from "@/types/schema";

export type PlanTier = Tenant["plan"];

export type PlanLimits = {
  exhibitions: number;
  storageMb: number;
  viewsPerMonth: number;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    exhibitions: 1,
    storageMb: 50,
    viewsPerMonth: 500,
  },
  starter: {
    exhibitions: 3,
    storageMb: 500,
    viewsPerMonth: 5000,
  },
  pro: {
    exhibitions: 10,
    storageMb: 5000,
    viewsPerMonth: 50000,
  },
  enterprise: {
    exhibitions: 100,
    storageMb: 50000,
    viewsPerMonth: 500000,
  },
};

function isPlanTier(value: unknown): value is PlanTier {
  return (
    value === "free" ||
    value === "starter" ||
    value === "pro" ||
    value === "enterprise"
  );
}

export function normalizePlan(value: unknown): PlanTier {
  return isPlanTier(value) ? value : "free";
}

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canCreateExhibition(plan: PlanTier, currentCount: number): boolean {
  if (!Number.isFinite(currentCount) || currentCount < 0) {
    return true;
  }

  return currentCount < PLAN_LIMITS[plan].exhibitions;
}

export function getRemainingExhibitions(plan: PlanTier, currentCount: number): number {
  if (!Number.isFinite(currentCount) || currentCount < 0) {
    return PLAN_LIMITS[plan].exhibitions;
  }

  return Math.max(0, PLAN_LIMITS[plan].exhibitions - currentCount);
}

/** Alias for backwards-compat with #13 analytics code */
export type PlanType = PlanTier;

export function isViewLimitReached(plan: PlanTier, currentMonthlyViews: number): boolean {
  if (!Number.isFinite(currentMonthlyViews) || currentMonthlyViews < 0) {
    return false;
  }

  return currentMonthlyViews >= PLAN_LIMITS[plan].viewsPerMonth;
}
