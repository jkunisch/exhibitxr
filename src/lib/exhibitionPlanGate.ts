export type ExhibitionCreationEntitlements = {
  plan: string;
  currentExhibitions: number;
  maxExhibitions: number;
  canCreateExhibition: boolean;
};

export function getExhibitionCreationLimitError(
  entitlements: ExhibitionCreationEntitlements,
): string | null {
  if (entitlements.canCreateExhibition) {
    return null;
  }

  return `Plan limit reached (${entitlements.currentExhibitions}/${entitlements.maxExhibitions} exhibitions on ${entitlements.plan}). Upgrade required.`;
}
