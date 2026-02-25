import { FieldPath } from "firebase-admin/firestore";
import { notFound } from "next/navigation";

import EmbedViewer from "@/components/3d/EmbedViewer";
import PaywallOverlay from "@/components/3d/PaywallOverlay";
import {
  automotiveDemoConfig,
  demoConfig,
  industrialDemoConfig,
} from "@/data/demo";
import {
  applyPlanLimitsToBranding,
  compactEmbedBranding,
  normalizeEmbedBranding,
  normalizeTenantPlan,
} from "@/lib/branding";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  DEFAULT_AMBIENT_INTENSITY,
  sanitizeAmbientIntensity,
} from "@/lib/lighting";
import { isViewLimitReached } from "@/lib/planLimits";
import { parseExhibitConfig } from "@/lib/validateConfig";
import type { EmbedBranding } from "@/types/branding";
import type { ExhibitConfig } from "@/types/schema";

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

type EmbedLoadResult = {
  config: ExhibitConfig;
  branding: EmbedBranding;
  ambientIntensity: number;
  tenantId: string;
  tenantPlan: string;
} | null;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function buildConfigInput(
  exhibitionId: string,
  tenantId: string,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const sourceId =
    typeof source.id === "string" && source.id.trim().length > 0
      ? source.id
      : exhibitionId;

  return {
    ...source,
    id: sourceId,
    tenantId,
  };
}

async function loadEmbedData(exhibitionId: string): Promise<EmbedLoadResult> {
  const demoConfigs: Record<string, ExhibitConfig> = {
    demo: demoConfig,
    "demo-industrial": industrialDemoConfig,
    "demo-automotive": automotiveDemoConfig,
  };

  const demoMatch = demoConfigs[exhibitionId];
  if (demoMatch) {
    try {
      return {
        config: parseExhibitConfig(demoMatch),
        branding: {},
        ambientIntensity: DEFAULT_AMBIENT_INTENSITY,
        tenantId: "demo",
        tenantPlan: "pro",
      };
    } catch {
      return null;
    }
  }

  const adminDb = getAdminDb();

  let snapshot = await adminDb
    .collectionGroup("exhibitions")
    .where("id", "==", exhibitionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    snapshot = await adminDb
      .collectionGroup("exhibitions")
      .where(FieldPath.documentId(), "==", exhibitionId)
      .limit(1)
      .get();
  }

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.isPublished !== true) {
    return null;
  }

  const tenantId =
    typeof data.tenantId === "string"
      ? data.tenantId
      : doc.ref.parent.parent?.id;
  if (!tenantId) {
    return null;
  }

  const rawConfig = asRecord(data.config) ?? asRecord(data);
  if (!rawConfig) {
    return null;
  }

  const configInput = buildConfigInput(exhibitionId, tenantId, rawConfig);

  let config: ExhibitConfig;
  try {
    config = parseExhibitConfig(configInput);
  } catch {
    return null;
  }

  const ambientIntensity = sanitizeAmbientIntensity(data.ambientIntensity);
  const tenantSnapshot = await adminDb.collection("tenants").doc(tenantId).get();
  const tenantPlan = normalizeTenantPlan(tenantSnapshot.data()?.plan);
  const branding = compactEmbedBranding(
    applyPlanLimitsToBranding(normalizeEmbedBranding(data.branding), tenantPlan),
  );

  return {
    config,
    branding,
    ambientIntensity,
    tenantId,
    tenantPlan,
  };
}

/**
 * Embed route: loads exhibition config from Firestore.
 * Public route, but only published exhibitions are rendered.
 * Enforces view limits per tenant plan.
 */
export default async function EmbedPage({ params }: EmbedPageProps) {
  const { id } = await params;
  const embedData = await loadEmbedData(id);

  if (!embedData) {
    return notFound();
  }

  // ─── View Limit Enforcement ──────────────────────────────────
  const adminDb = getAdminDb();
  const monthKey = new Date().toISOString().substring(0, 7);
  const statsDoc = await adminDb
    .collection("tenants")
    .doc(embedData.tenantId)
    .collection("stats")
    .doc("views")
    .get();

  const statsData = statsDoc.data();
  const monthlyViews = statsData?.monthly?.[monthKey] || 0;

  if (isViewLimitReached(embedData.tenantPlan as Parameters<typeof isViewLimitReached>[0], monthlyViews)) {
    return <PaywallOverlay />;
  }

  return (
    <EmbedViewer
      modelUrl={embedData.config.model.glbUrl}
      title={embedData.config.title}
      tenantId={embedData.tenantId}
    />
  );
}

