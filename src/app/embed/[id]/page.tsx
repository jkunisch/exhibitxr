import { demoConfig } from "@/data/demo";
import {
  applyPlanLimitsToBranding,
  compactEmbedBranding,
  normalizeEmbedBranding,
  normalizeTenantPlan,
} from "@/lib/branding";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { parseExhibitConfig } from "@/lib/validateConfig";
import EmbedViewer from "@/components/3d/EmbedViewer";
import type { EmbedBranding } from "@/types/branding";
import type { ExhibitConfig } from "@/types/schema";
import { FieldPath } from "firebase-admin/firestore";

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

type EmbedLoadResult = {
  config: ExhibitConfig;
  branding: EmbedBranding;
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
  source: unknown,
): Record<string, unknown> | null {
  const sourceRecord = asRecord(source);
  if (!sourceRecord) {
    return null;
  }

  return {
    ...sourceRecord,
    id:
      typeof sourceRecord.id === "string" && sourceRecord.id.trim().length > 0
        ? sourceRecord.id
        : exhibitionId,
    tenantId,
  };
}

async function loadEmbedData(exhibitionId: string): Promise<EmbedLoadResult> {
  if (exhibitionId === "demo") {
    return {
      config: parseExhibitConfig(demoConfig),
      branding: {},
    };
  }

  const adminDb = getAdminDb();
  const querySnapshot = await adminDb
    .collectionGroup("exhibitions")
    .where(FieldPath.documentId(), "==", exhibitionId)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const exhibitionDocument = querySnapshot.docs[0];
  const exhibitionData = exhibitionDocument.data();

  if (exhibitionData.isPublished !== true) {
    return null;
  }

  const tenantId =
    typeof exhibitionData.tenantId === "string"
      ? exhibitionData.tenantId
      : exhibitionDocument.ref.parent.parent?.id;

  if (!tenantId) {
    return null;
  }

  const configSource = exhibitionData.config ?? exhibitionData;
  const configInput = buildConfigInput(exhibitionId, tenantId, configSource);
  if (!configInput) {
    return null;
  }

  let parsedConfig: ExhibitConfig;
  try {
    parsedConfig = parseExhibitConfig(configInput);
  } catch {
    return null;
  }

  const tenantSnapshot = await adminDb.collection("tenants").doc(tenantId).get();
  const tenantPlan = normalizeTenantPlan(tenantSnapshot.data()?.plan);
  const normalizedBranding = normalizeEmbedBranding(exhibitionData.branding);
  const effectiveBranding = compactEmbedBranding(
    applyPlanLimitsToBranding(normalizedBranding, tenantPlan),
  );

  return {
    config: parsedConfig,
    branding: effectiveBranding,
  };
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { id } = await params;
  const embedData = await loadEmbedData(id);

  if (!embedData) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#888",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Exhibit &quot;{id}&quot; not found.
      </div>
    );
  }

  return <EmbedViewer config={embedData.config} branding={embedData.branding} />;
}
