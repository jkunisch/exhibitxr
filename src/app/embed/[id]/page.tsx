import { notFound } from "next/navigation";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { parseExhibitConfig } from "@/lib/validateConfig";
import EmbedViewer from "@/components/3d/EmbedViewer";
import {
  demoConfig,
  industrialDemoConfig,
  automotiveDemoConfig,
} from "@/data/demo";
import type { ExhibitConfig } from "@/types/schema";
import {
  DEFAULT_AMBIENT_INTENSITY,
  sanitizeAmbientIntensity,
} from "@/lib/lighting";

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
    ambientIntensity = sanitizeAmbientIntensity(data.ambientIntensity);

    // Nur publizierte Ausstellungen anzeigen
    if (data.isPublished !== true) {
      console.info(`Exhibition "${id}" is not published.`);
      return notFound();
    }

    // Validierung gegen das Schema (src/types/schema.ts)
    config = parseExhibitConfig(data);
  } catch (error) {
    console.error("Error loading exhibition from Firestore:", error);
    return notFound();
  }

  return <EmbedViewer config={config} ambientIntensity={ambientIntensity} enableChat />;
}
