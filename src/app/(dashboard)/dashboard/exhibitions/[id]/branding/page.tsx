import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { normalizeEmbedBranding, normalizeTenantPlan } from "@/lib/branding";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionUser } from "@/lib/session";
import type { EmbedBranding } from "@/types/branding";

import { BrandingEditorClient } from "./BrandingEditorClient";

export const dynamic = "force-dynamic";

type BrandingPageParams = Promise<{
  id: string;
}>;

type BrandingContext = {
  exhibitionId: string;
  exhibitionTitle: string;
  tenantId: string;
  tenantPlan: "free" | "starter" | "pro" | "enterprise";
  initialBranding: EmbedBranding;
};

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

async function loadBrandingContext(
  tenantId: string,
  exhibitionId: string,
): Promise<BrandingContext | null> {
  const adminDb = getAdminDb();
  const tenantRef = adminDb.collection("tenants").doc(tenantId);
  const exhibitionRef = tenantRef.collection("exhibitions").doc(exhibitionId);

  const [tenantSnapshot, exhibitionSnapshot] = await Promise.all([
    tenantRef.get(),
    exhibitionRef.get(),
  ]);

  if (!exhibitionSnapshot.exists) {
    return null;
  }

  const exhibitionData = exhibitionSnapshot.data();
  const documentTenantId =
    typeof exhibitionData?.tenantId === "string"
      ? exhibitionData.tenantId
      : tenantId;
  if (documentTenantId !== tenantId) {
    return null;
  }

  const exhibitionTitle = asNonEmptyString(
    exhibitionData?.title,
    "Untitled exhibition",
  );
  const tenantPlan = normalizeTenantPlan(tenantSnapshot.data()?.plan);
  const initialBranding = normalizeEmbedBranding(exhibitionData?.branding);

  return {
    exhibitionId,
    exhibitionTitle,
    tenantId,
    tenantPlan,
    initialBranding,
  };
}

export default async function ExhibitionBrandingPage({
  params,
}: {
  params: BrandingPageParams;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?next=/dashboard/exhibitions");
  }

  const resolvedParams = await params;
  const brandingContext = await loadBrandingContext(
    sessionUser.tenantId,
    resolvedParams.id,
  );
  if (!brandingContext) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/exhibitions/${brandingContext.exhibitionId}`}
            className="inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
          >
            Back to Exhibition
          </Link>
          <Link
            href={`/embed/${brandingContext.exhibitionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/20"
          >
            Open Embed
          </Link>
        </div>

        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
          Plan: {brandingContext.tenantPlan}
        </p>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/75">
          Embed Branding
        </p>
        <h1 className="mt-2 text-xl font-semibold text-white">
          {brandingContext.exhibitionTitle}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Customize logo, color, font, watermark, and optional CSS for this
          exhibition embed.
        </p>
      </div>

      <BrandingEditorClient
        exhibitionId={brandingContext.exhibitionId}
        exhibitionTitle={brandingContext.exhibitionTitle}
        tenantId={brandingContext.tenantId}
        tenantPlan={brandingContext.tenantPlan}
        initialBranding={brandingContext.initialBranding}
      />
    </section>
  );
}
