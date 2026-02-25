import type { EmbedBranding } from "@/types/branding";

const TENANT_PLANS = ["free", "starter", "pro", "enterprise"] as const;
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const MAX_LOGO_URL_LENGTH = 2048;
const MAX_FONT_FAMILY_LENGTH = 120;
const MAX_CUSTOM_CSS_LENGTH = 8000;

const GOOGLE_FONT_IMPORTS: Record<string, string> = {
  Inter: "Inter:wght@400;500;600;700",
  Outfit: "Outfit:wght@400;500;600;700",
  Roboto: "Roboto:wght@400;500;700",
  Poppins: "Poppins:wght@400;500;600;700",
  "Space Grotesk": "Space+Grotesk:wght@400;500;600;700",
};

export type TenantPlan = (typeof TENANT_PLANS)[number];

export const EMBED_FONT_OPTIONS = [
  { label: "Inter", value: "Inter" },
  { label: "Outfit", value: "Outfit" },
  { label: "Roboto", value: "Roboto" },
  { label: "Poppins", value: "Poppins" },
  { label: "Space Grotesk", value: "Space Grotesk" },
  { label: "system-ui", value: "system-ui" },
] as const;

export const DEFAULT_EMBED_PRIMARY_COLOR = "#00aaff";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStringValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function hasOwnKey(
  value: object,
  key: PropertyKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function normalizeTenantPlan(value: unknown): TenantPlan {
  if (typeof value !== "string") {
    return "free";
  }

  const match = TENANT_PLANS.find((plan) => plan === value);
  return match ?? "free";
}

export function canHideWatermarkForPlan(plan: TenantPlan): boolean {
  return plan === "pro" || plan === "enterprise";
}

export function resolveEmbedPrimaryColor(
  branding: Pick<EmbedBranding, "primaryColor"> | undefined,
): string {
  const rawColor = normalizeStringValue(branding?.primaryColor);

  if (!rawColor || !HEX_COLOR_PATTERN.test(rawColor)) {
    return DEFAULT_EMBED_PRIMARY_COLOR;
  }

  return rawColor.toLowerCase();
}

export function buildEmbedFontFamily(fontFamily: string | undefined): string {
  const normalized = normalizeStringValue(fontFamily);
  if (!normalized || normalized === "system-ui") {
    return "system-ui, sans-serif";
  }

  const safeFamily = normalized.replace(/['"]/g, "");
  return `"${safeFamily}", system-ui, sans-serif`;
}

export function buildGoogleFontImportRule(
  fontFamily: string | undefined,
): string | null {
  const normalized = normalizeStringValue(fontFamily);
  if (!normalized || normalized === "system-ui") {
    return null;
  }

  const queryValue = GOOGLE_FONT_IMPORTS[normalized];
  if (!queryValue) {
    return null;
  }

  return `@import url("https://fonts.googleapis.com/css2?family=${queryValue}&display=swap");`;
}

export function normalizeEmbedBranding(value: unknown): EmbedBranding {
  if (!isRecord(value)) {
    return {};
  }

  const branding: EmbedBranding = {};

  const logoUrl = normalizeStringValue(value.logoUrl);
  if (
    logoUrl &&
    logoUrl.length <= MAX_LOGO_URL_LENGTH &&
    isHttpUrl(logoUrl)
  ) {
    branding.logoUrl = logoUrl;
  }

  const primaryColor = normalizeStringValue(value.primaryColor);
  if (primaryColor && HEX_COLOR_PATTERN.test(primaryColor)) {
    branding.primaryColor = primaryColor.toLowerCase();
  }

  const fontFamily = normalizeStringValue(value.fontFamily);
  if (fontFamily && fontFamily.length <= MAX_FONT_FAMILY_LENGTH) {
    branding.fontFamily = fontFamily;
  }

  if (typeof value.hideWatermark === "boolean") {
    branding.hideWatermark = value.hideWatermark;
  }

  const customCss = normalizeStringValue(value.customCss);
  if (customCss && customCss.length <= MAX_CUSTOM_CSS_LENGTH) {
    branding.customCss = customCss;
  }

  return branding;
}

export type BrandingPatchValidationResult =
  | { ok: true; value: Partial<EmbedBranding> }
  | { ok: false; error: string };

export function validateEmbedBrandingPatch(
  input: Partial<EmbedBranding>,
): BrandingPatchValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: "Invalid branding payload." };
  }

  const patch: Partial<EmbedBranding> = {};

  if (hasOwnKey(input, "logoUrl")) {
    const rawLogoUrl = input.logoUrl;
    if (rawLogoUrl !== undefined && typeof rawLogoUrl !== "string") {
      return { ok: false, error: "Logo URL must be a string." };
    }

    const logoUrl = normalizeStringValue(rawLogoUrl);
    if (!logoUrl) {
      patch.logoUrl = undefined;
    } else if (logoUrl.length > MAX_LOGO_URL_LENGTH) {
      return { ok: false, error: "Logo URL is too long." };
    } else if (!isHttpUrl(logoUrl)) {
      return { ok: false, error: "Logo URL must be a valid http(s) URL." };
    } else {
      patch.logoUrl = logoUrl;
    }
  }

  if (hasOwnKey(input, "primaryColor")) {
    const rawPrimaryColor = input.primaryColor;
    if (rawPrimaryColor !== undefined && typeof rawPrimaryColor !== "string") {
      return { ok: false, error: "Primary color must be a string." };
    }

    const primaryColor = normalizeStringValue(rawPrimaryColor);
    if (!primaryColor) {
      patch.primaryColor = undefined;
    } else if (!HEX_COLOR_PATTERN.test(primaryColor)) {
      return {
        ok: false,
        error: "Primary color must be a hex value (for example #00aaff).",
      };
    } else {
      patch.primaryColor = primaryColor.toLowerCase();
    }
  }

  if (hasOwnKey(input, "fontFamily")) {
    const rawFontFamily = input.fontFamily;
    if (rawFontFamily !== undefined && typeof rawFontFamily !== "string") {
      return { ok: false, error: "Font family must be a string." };
    }

    const fontFamily = normalizeStringValue(rawFontFamily);
    if (!fontFamily) {
      patch.fontFamily = undefined;
    } else if (fontFamily.length > MAX_FONT_FAMILY_LENGTH) {
      return { ok: false, error: "Font family is too long." };
    } else {
      patch.fontFamily = fontFamily;
    }
  }

  if (hasOwnKey(input, "hideWatermark")) {
    const rawHideWatermark = input.hideWatermark;
    if (rawHideWatermark !== undefined && typeof rawHideWatermark !== "boolean") {
      return { ok: false, error: "hideWatermark must be a boolean." };
    }

    patch.hideWatermark = rawHideWatermark;
  }

  if (hasOwnKey(input, "customCss")) {
    const rawCustomCss = input.customCss;
    if (rawCustomCss !== undefined && typeof rawCustomCss !== "string") {
      return { ok: false, error: "Custom CSS must be a string." };
    }

    const customCss = normalizeStringValue(rawCustomCss);
    if (!customCss) {
      patch.customCss = undefined;
    } else if (customCss.length > MAX_CUSTOM_CSS_LENGTH) {
      return { ok: false, error: "Custom CSS exceeds 8000 characters." };
    } else {
      patch.customCss = customCss;
    }
  }

  return { ok: true, value: patch };
}

export function mergeBrandingPatch(
  current: EmbedBranding,
  patch: Partial<EmbedBranding>,
): EmbedBranding {
  const merged: EmbedBranding = { ...current };

  if (hasOwnKey(patch, "logoUrl")) {
    if (patch.logoUrl) {
      merged.logoUrl = patch.logoUrl;
    } else {
      delete merged.logoUrl;
    }
  }

  if (hasOwnKey(patch, "primaryColor")) {
    if (patch.primaryColor) {
      merged.primaryColor = patch.primaryColor;
    } else {
      delete merged.primaryColor;
    }
  }

  if (hasOwnKey(patch, "fontFamily")) {
    if (patch.fontFamily) {
      merged.fontFamily = patch.fontFamily;
    } else {
      delete merged.fontFamily;
    }
  }

  if (hasOwnKey(patch, "hideWatermark")) {
    if (patch.hideWatermark === true) {
      merged.hideWatermark = true;
    } else {
      delete merged.hideWatermark;
    }
  }

  if (hasOwnKey(patch, "customCss")) {
    if (patch.customCss) {
      merged.customCss = patch.customCss;
    } else {
      delete merged.customCss;
    }
  }

  return merged;
}

export function applyPlanLimitsToBranding(
  branding: EmbedBranding,
  plan: TenantPlan,
): EmbedBranding {
  const limitedBranding: EmbedBranding = { ...branding };

  if (!canHideWatermarkForPlan(plan)) {
    delete limitedBranding.hideWatermark;
  }

  if (plan !== "enterprise") {
    delete limitedBranding.customCss;
  }

  return limitedBranding;
}

export function compactEmbedBranding(branding: EmbedBranding): EmbedBranding {
  const compact: EmbedBranding = {};

  if (branding.logoUrl) {
    compact.logoUrl = branding.logoUrl;
  }

  if (branding.primaryColor) {
    compact.primaryColor = branding.primaryColor;
  }

  if (branding.fontFamily) {
    compact.fontFamily = branding.fontFamily;
  }

  if (branding.hideWatermark === true) {
    compact.hideWatermark = true;
  }

  if (branding.customCss) {
    compact.customCss = branding.customCss;
  }

  return compact;
}

export function isEmbedBrandingEmpty(branding: EmbedBranding): boolean {
  return Object.keys(compactEmbedBranding(branding)).length === 0;
}
