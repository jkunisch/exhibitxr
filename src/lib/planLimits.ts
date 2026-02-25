/**
 * Plan-Limits fuer ExhibitXR.
 * Definiert, wie viele Ausstellungen und Views pro Monat erlaubt sind.
 */

export const PLAN_LIMITS = {
  free: {
    maxExhibitions: 1,
    maxViewsPerMonth: 100,
    features: ["Standard 3D Viewer", "1 Ausstellung"],
  },
  starter: {
    maxExhibitions: 5,
    maxViewsPerMonth: 1000,
    features: ["Standard 3D Viewer", "5 Ausstellungen", "Hotspots"],
  },
  pro: {
    maxExhibitions: 20,
    maxViewsPerMonth: 10000,
    features: ["Premium 3D Viewer", "20 Ausstellungen", "Hotspots", "Variants", "No Branding"],
  },
  enterprise: {
    maxExhibitions: 100,
    maxViewsPerMonth: 100000,
    features: ["Full Access", "Custom Limits", "Priority Support"],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Prueft, ob ein Tenant eine weitere Ausstellung erstellen darf.
 */
export function canCreateExhibition(plan: PlanType, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxExhibitions;
}

/**
 * Prueft, ob das View-Limit erreicht ist.
 */
export function isViewLimitReached(plan: PlanType, currentViews: number): boolean {
  return currentViews >= PLAN_LIMITS[plan].maxViewsPerMonth;
}
