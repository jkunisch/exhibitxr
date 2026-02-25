"use client";

import { ChangeEvent, useMemo, useState, useTransition } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { updateBrandingAction } from "@/app/actions/branding";
import {
  buildEmbedFontFamily,
  buildGoogleFontImportRule,
  canHideWatermarkForPlan,
  EMBED_FONT_OPTIONS,
  resolveEmbedPrimaryColor,
  type TenantPlan,
} from "@/lib/branding";
import { storage } from "@/lib/firebase";
import type { EmbedBranding } from "@/types/branding";

type BrandingEditorClientProps = {
  exhibitionId: string;
  exhibitionTitle: string;
  tenantId: string;
  tenantPlan: TenantPlan;
  initialBranding: EmbedBranding;
};

type MiniEmbedPreviewProps = {
  exhibitionTitle: string;
  logoUrl: string;
  primaryColor: string;
  fontFamily: string;
  hideWatermark: boolean;
  tenantPlan: TenantPlan;
};

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function MiniEmbedPreview({
  exhibitionTitle,
  logoUrl,
  primaryColor,
  fontFamily,
  hideWatermark,
  tenantPlan,
}: MiniEmbedPreviewProps) {
  const shouldShowWatermark =
    !hideWatermark || !canHideWatermarkForPlan(tenantPlan);
  const googleFontImportRule = buildGoogleFontImportRule(fontFamily);
  const fontStack = buildEmbedFontFamily(fontFamily);

  return (
    <aside className="rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/75">
        Live Preview
      </p>
      <div className="mt-3 overflow-hidden rounded-xl border border-white/15 bg-slate-950">
        {googleFontImportRule ? <style>{googleFontImportRule}</style> : null}

        <div
          className="relative h-[360px] w-full bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.12),transparent_32%),radial-gradient(circle_at_80%_100%,rgba(255,255,255,0.1),transparent_35%),linear-gradient(140deg,#030712,#111827_46%,#0f172a)] text-white"
          style={{ fontFamily: fontStack }}
        >
          <div className="absolute inset-0" />
          <div className="relative z-10 flex h-full flex-col justify-between p-3">
            <div className="space-y-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Brand logo preview"
                  className="max-h-10 max-w-[120px] object-contain"
                />
              ) : (
                <div className="inline-flex h-10 w-[120px] items-center justify-center rounded-md border border-white/20 bg-white/10 text-[10px] uppercase tracking-[0.2em] text-white/75">
                  No Logo
                </div>
              )}
              <p className="text-sm font-semibold text-white/90">
                {exhibitionTitle}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{
                    border: `2px solid ${primaryColor}`,
                    background: `${primaryColor}26`,
                    color: "#ffffff",
                  }}
                >
                  Variant A
                </button>
                <button
                  type="button"
                  className="rounded-md border px-2.5 py-1 text-xs font-medium text-white/80"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    background: "rgba(2, 6, 23, 0.75)",
                  }}
                >
                  Variant B
                </button>
              </div>

              <div
                className="rounded-lg border bg-black/60 p-2.5 text-xs text-white/85"
                style={{ borderColor: `${primaryColor}66` }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: primaryColor }}
                >
                  Hotspot Chat
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/80">
                  Material and feature details inherit your selected color and
                  font in the embed.
                </p>
              </div>
            </div>
          </div>

          {shouldShowWatermark ? (
            <a
              href="https://exhibitxr.app"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 left-2 z-30"
              style={{
                fontSize: 10,
                lineHeight: 1.3,
                color: "rgba(255, 255, 255, 0.9)",
                opacity: 0.4,
              }}
            >
              Powered by ExhibitXR
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function BrandingEditorClient({
  exhibitionId,
  exhibitionTitle,
  tenantId,
  tenantPlan,
  initialBranding,
}: BrandingEditorClientProps) {
  const [logoUrl, setLogoUrl] = useState(initialBranding.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    initialBranding.primaryColor ?? "#00aaff",
  );
  const [fontFamily, setFontFamily] = useState(
    initialBranding.fontFamily ?? "system-ui",
  );
  const [hideWatermark, setHideWatermark] = useState(
    initialBranding.hideWatermark === true,
  );
  const [customCss, setCustomCss] = useState(initialBranding.customCss ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isPending, startTransition] = useTransition();

  const watermarkToggleDisabled = !canHideWatermarkForPlan(tenantPlan);
  const customCssDisabled = tenantPlan !== "enterprise";

  const normalizedPrimaryColor = useMemo(
    () => resolveEmbedPrimaryColor({ primaryColor }),
    [primaryColor],
  );

  const normalizedFontFamily = useMemo(() => {
    const trimmed = fontFamily.trim();
    return trimmed.length > 0 ? trimmed : "system-ui";
  }, [fontFamily]);

  const handleLogoUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (selectedFile.size > MAX_LOGO_SIZE_BYTES) {
      setError("Logo file is too large (max 5MB).");
      return;
    }

    setIsUploadingLogo(true);

    try {
      const logoRef = ref(storage, `tenants/${tenantId}/branding/logo.png`);
      await uploadBytes(logoRef, selectedFile, {
        contentType: selectedFile.type,
        cacheControl: "public,max-age=3600",
      });

      const downloadUrl = await getDownloadURL(logoRef);
      setLogoUrl(downloadUrl);
      setSuccessMessage("Logo uploaded. Save to apply branding.");
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Logo upload failed."));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = () => {
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const payload: Partial<EmbedBranding> = {
          logoUrl: logoUrl.trim() || undefined,
          primaryColor: normalizedPrimaryColor,
          fontFamily: normalizedFontFamily,
          hideWatermark: watermarkToggleDisabled ? false : hideWatermark,
          customCss: customCssDisabled ? undefined : customCss,
        };

        const result = await updateBrandingAction(exhibitionId, payload);
        if (!result.ok) {
          setError(result.error);
          return;
        }

        setSuccessMessage("Branding saved.");
      } catch (saveError) {
        setError(getErrorMessage(saveError, "Could not save branding."));
      }
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Logo</p>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/15 bg-black/20 p-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Current logo"
                  className="max-h-10 max-w-[120px] object-contain"
                />
              ) : (
                <span className="text-xs text-white/70">No logo uploaded</span>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo || isPending}
                  />
                  {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                </label>

                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="rounded-lg border border-white/20 bg-transparent px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                  disabled={isPending || isUploadingLogo}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-xs text-white/60">
              Storage path: <code>tenants/{tenantId}/branding/logo.png</code>
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="primaryColor"
              className="text-sm font-medium text-white"
            >
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primaryColorPicker"
                type="color"
                value={normalizedPrimaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-white/20 bg-transparent"
                disabled={isPending}
              />
              <input
                id="primaryColor"
                type="text"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                placeholder="#00aaff"
                className="w-full rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/35"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fontFamily" className="text-sm font-medium text-white">
              Font Family
            </label>
            <select
              id="fontFamily"
              value={fontFamily}
              onChange={(event) => setFontFamily(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/35"
              disabled={isPending}
            >
              {EMBED_FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={hideWatermark}
                onChange={(event) => setHideWatermark(event.target.checked)}
                disabled={watermarkToggleDisabled || isPending}
                className="h-4 w-4 rounded border-white/35 bg-black/30 text-cyan-300 focus:ring-cyan-300/55"
              />
              ExhibitXR Wasserzeichen ausblenden
            </label>
            {watermarkToggleDisabled ? (
              <p className="text-xs text-white/60">
                Available on Pro and Enterprise plans. Free plan always shows
                the watermark.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="customCss" className="text-sm font-medium text-white">
              Custom CSS (Enterprise)
            </label>
            <textarea
              id="customCss"
              rows={8}
              value={customCss}
              onChange={(event) => setCustomCss(event.target.value)}
              disabled={customCssDisabled || isPending}
              placeholder={
                customCssDisabled
                  ? "Enterprise plan required"
                  : ".my-selector { color: #00aaff; }"
              }
              className="w-full rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/35 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || isUploadingLogo}
            className="rounded-xl border border-cyan-300/45 bg-cyan-300/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isPending ? "Saving..." : "Save Branding"}
          </button>
        </form>
      </section>

      <MiniEmbedPreview
        exhibitionTitle={exhibitionTitle}
        logoUrl={logoUrl}
        primaryColor={normalizedPrimaryColor}
        fontFamily={normalizedFontFamily}
        hideWatermark={hideWatermark}
        tenantPlan={tenantPlan}
      />
    </div>
  );
}
