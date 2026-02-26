import type { Tenant } from "@/types/schema";
import { isAdminEmail as isConfiguredAdminEmail } from "@/lib/adminEmails";

export type PlanTier = Tenant["plan"];

export type PlanLimits = {
  exhibitions: number;
  storageMb: number;
  viewsPerMonth: number;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    exhibitions: Infinity, // Unlimited projects, gated by credits
    storageMb: 1000,
    viewsPerMonth: 1000,
  },
  starter: {
    exhibitions: Infinity, // Unlimited projects, gated by credits
    storageMb: 10000,
    viewsPerMonth: 10000,
  },
  pro: {
    exhibitions: Infinity, // Unlimited projects, gated by credits
    storageMb: 50000,
    viewsPerMonth: 100000,
  },
  enterprise: {
    exhibitions: Infinity,
    storageMb: 1000000,
    viewsPerMonth: 1000000,
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

export function isAdminEmail(email: string | null | undefined): boolean {
  return isConfiguredAdminEmail(email);
}

export function canCreateExhibition(plan: PlanTier, currentCount: number, email?: string | null): boolean {
  if (isAdminEmail(email)) return true;

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
