import { notFound } from "next/navigation";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { parseExhibitConfig } from "@/lib/validateConfig";
import EmbedViewer from "@/components/3d/EmbedViewer";
import PaywallOverlay from "@/components/3d/PaywallOverlay";
import {
  demoConfig,
  industrialDemoConfig,
  automotiveDemoConfig,
} from "@/data/demo";
import type { ExhibitConfig, Tenant } from "@/types/schema";
import {
  DEFAULT_AMBIENT_INTENSITY,
  sanitizeAmbientIntensity,
} from "@/lib/lighting";
import { isViewLimitReached, PlanType } from "@/lib/planLimits";

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Embed-Route: Laedt Ausstellungs-Konfiguration aus Firestore.
 * Oeffentlich zugaenglich, prueft isPublished Status.
 */
export default async function EmbedPage({ params }: EmbedPageProps) {
  const { id } = await params;

  let config: ExhibitConfig;
  let ambientIntensity = DEFAULT_AMBIENT_INTENSITY;

  // Spezialfall: Demo-Konfigurationen
  const demoConfigs: Record<string, ExhibitConfig> = {
    demo: demoConfig,
    "demo-industrial": industrialDemoConfig,
    "demo-automotive": automotiveDemoConfig,
  };

  const demoMatch = demoConfigs[id];
  if (demoMatch) {
    try {
      config = parseExhibitConfig(demoMatch);
    } catch (error) {
      console.error("Error loading demo config:", error);
      return notFound();
    }

    return <EmbedViewer config={config} ambientIntensity={ambientIntensity} enableChat />;
  }

  const adminDb = getAdminDb();

  try {
    // Collection Group Query: Sucht in allen Tenants nach der Exhibit-ID.
    // Pfad in Firestore: /tenants/{tenantId}/exhibitions/{exhibitId}
    const snapshot = await adminDb
      .collectionGroup("exhibitions")
      .where("id", "==", id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn(`Exhibition with ID "${id}" not found.`);
      return notFound();
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const tenantId = data.tenantId;

    ambientIntensity = sanitizeAmbientIntensity(data.ambientIntensity);

    // Nur publizierte Ausstellungen anzeigen
    if (data.isPublished !== true) {
      console.info(`Exhibition "${id}" is not published.`);
      return notFound();
    }

    // Validierung gegen das Schema (src/types/schema.ts)
    config = parseExhibitConfig(data);

    // ─── Plan Enforcement ──────────────────────────────────────────
    // 1. Tenant Plan lesen
    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
    if (!tenantDoc.exists) {
      console.error(`Tenant "${tenantId}" not found for exhibition "${id}".`);
      return notFound();
    }
    const tenantData = tenantDoc.data() as Tenant;
    const plan = tenantData.plan as PlanType;

    // 2. Aktuelle Views fuer diesen Monat lesen
    const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
    const statsDoc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("stats")
      .doc("views")
      .get();
    
    const statsData = statsDoc.data();
    const monthlyViews = statsData?.monthly?.[monthKey] || 0;

    // 3. Limit pruefen
    if (isViewLimitReached(plan, monthlyViews)) {
      console.warn(`View limit reached for tenant "${tenantId}". Plan: ${plan}, Views: ${monthlyViews}`);
      return <PaywallOverlay />;
    }

  } catch (error) {
    console.error("Error loading exhibition from Firestore:", error);
    return notFound();
  }

  return <EmbedViewer config={config} ambientIntensity={ambientIntensity} enableChat />;
}

