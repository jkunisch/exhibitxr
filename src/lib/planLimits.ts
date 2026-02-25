export type LimitedPlan = "free" | "starter" | "pro";
export type TenantPlan = LimitedPlan | "enterprise";
export type PlanLimits = {
  exhibitions: number;
  storageMb: number;
  viewsPerMonth: number;
};

export const PLAN_LIMITS: Record<LimitedPlan, PlanLimits> = {
  free: { exhibitions: 1, storageMb: 50, viewsPerMonth: 500 },
  starter: { exhibitions: 3, storageMb: 500, viewsPerMonth: 5000 },
  pro: { exhibitions: 10, storageMb: 5000, viewsPerMonth: 50000 },
};

const ENTERPRISE_LIMITS: PlanLimits = {
  exhibitions: Number.MAX_SAFE_INTEGER,
  storageMb: Number.MAX_SAFE_INTEGER,
  viewsPerMonth: Number.MAX_SAFE_INTEGER,
};

export function getPlanLimits(plan: TenantPlan): PlanLimits {
  if (plan === "enterprise") {
    return ENTERPRISE_LIMITS;
  }

  return PLAN_LIMITS[plan];
}

export function canCreateExhibition(plan: TenantPlan, currentCount: number): boolean {
  return currentCount < getPlanLimits(plan).exhibitions;
}
