"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

import {
  applyPlanLimitsToBranding,
  canHideWatermarkForPlan,
  compactEmbedBranding,
  hasOwnKey,
  isEmbedBrandingEmpty,
  mergeBrandingPatch,
  normalizeEmbedBranding,
  normalizeTenantPlan,
  validateEmbedBrandingPatch,
} from "@/lib/branding";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionUser } from "@/lib/session";
import type { EmbedBranding } from "@/types/branding";

export type BrandingMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateBrandingAction(
  exhibitId: string,
  branding: Partial<EmbedBranding>,
): Promise<BrandingMutationResult> {
  const normalizedExhibitId = exhibitId.trim();
  if (normalizedExhibitId.length === 0) {
    return { ok: false, error: "Missing exhibition id." };
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsedPatch = validateEmbedBrandingPatch(branding);
  if (!parsedPatch.ok) {
    return { ok: false, error: parsedPatch.error };
  }

  const adminDb = getAdminDb();
  const tenantRef = adminDb.collection("tenants").doc(sessionUser.tenantId);
  const exhibitionRef = tenantRef
    .collection("exhibitions")
    .doc(normalizedExhibitId);

  const [tenantSnapshot, exhibitionSnapshot] = await Promise.all([
    tenantRef.get(),
    exhibitionRef.get(),
  ]);

  if (!exhibitionSnapshot.exists) {
    return { ok: false, error: "Exhibition not found." };
  }

  const exhibitionData = exhibitionSnapshot.data();
  const exhibitionTenantId =
    typeof exhibitionData?.tenantId === "string"
      ? exhibitionData.tenantId
      : sessionUser.tenantId;
  if (exhibitionTenantId !== sessionUser.tenantId) {
    return { ok: false, error: "Tenant mismatch detected." };
  }

  const tenantPlan = normalizeTenantPlan(tenantSnapshot.data()?.plan);
  const patch = parsedPatch.value;

  if (
    hasOwnKey(patch, "hideWatermark") &&
    patch.hideWatermark === true &&
    !canHideWatermarkForPlan(tenantPlan)
  ) {
    return {
      ok: false,
      error: "Watermark removal is available on Pro and Enterprise plans.",
    };
  }

  if (
    hasOwnKey(patch, "customCss") &&
    patch.customCss &&
    tenantPlan !== "enterprise"
  ) {
    return {
      ok: false,
      error: "Custom CSS is available on the Enterprise plan only.",
    };
  }

  const currentBranding = normalizeEmbedBranding(exhibitionData?.branding);
  const mergedBranding = mergeBrandingPatch(currentBranding, patch);
  const compactBranding = compactEmbedBranding(
    applyPlanLimitsToBranding(mergedBranding, tenantPlan),
  );

  await exhibitionRef.update({
    branding: isEmbedBrandingEmpty(compactBranding)
      ? FieldValue.delete()
      : compactBranding,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/exhibitions");
  revalidatePath(`/dashboard/exhibitions/${normalizedExhibitId}`);
  revalidatePath(`/dashboard/exhibitions/${normalizedExhibitId}/branding`);
  revalidatePath(`/embed/${normalizedExhibitId}`);

  return { ok: true };
}
