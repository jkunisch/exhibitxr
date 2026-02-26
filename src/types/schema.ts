import { z } from "zod";

// ─── Tenant & User (bestehend) ──────────────────────────────────────────────

/** Ein Tenant ist eine Organisation. Ein User gehoert zu einer Organisation. */
export const TenantSchema = z.object({
  id: z.string(), // Generierte ID (NICHT die uid des Users!)
  name: z.string(),
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
  /** Remaining 3D generation credits (pay-per-use or plan-included). */
  generationCredits: z.number().int().min(0).default(1),
  /** Lifetime count of all generations used. */
  totalGenerationsUsed: z.number().int().min(0).default(0),
  /** Stripe customer ID (set after first checkout). */
  stripeCustomerId: z.string().optional(),
});

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  tenantId: z.string(), // Verknuepfung zur Organisation
  role: z.enum(["owner", "editor"]),
});

// ─── 3D Model & Config ─────────────────────────────────────────────────────

/** Material-Variante fuer ein 3D-Modell (z.B. Farbwechsel). */
export const ModelVariantSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Mesh-Namen im GLB, auf die diese Variante wirkt. */
  meshTargets: z.array(z.string()).min(1),
  color: z.string().optional(),
  roughness: z.number().min(0).max(1).optional(),
  metalness: z.number().min(0).max(1).optional(),
});

/** Hotspot: interaktiver Info-Punkt auf dem Modell. */
export const HotspotSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  /** 3D-Position [x, y, z] relativ zum Modell-Ursprung. */
  position: z.tuple([z.number(), z.number(), z.number()]),
  /** Kamera-Position beim Hotspot-Fokus [x, y, z]. */
  cameraPosition: z.tuple([z.number(), z.number(), z.number()]).optional(),
  /** Kamera-Blickziel beim Hotspot-Fokus [x, y, z]. */
  cameraTarget: z.tuple([z.number(), z.number(), z.number()]).optional(),
});

/** Ein 3D-Modell mit Varianten und Hotspots. */
export const ExhibitModelSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** URL zur GLB-Datei (Storage-URL oder CDN). */
  glbUrl: z.string().url(),
  /** URL zur USDZ-Datei für Apple AR Quick Look. */
  usdzUrl: z.string().url().optional(),
  /** URL zu einem Vorschaubild (Thumbnail). */
  thumbnailUrl: z.string().url().optional(),
  /** Skalierung (uniform). Standard: 1. */
  scale: z.number().positive().default(1),
  /** Position Offset [x, y, z]. */
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  variants: z.array(ModelVariantSchema).default([]),
  hotspots: z.array(HotspotSchema).default([]),
});

/** Vollstaendige Ausstellungs-Konfiguration. */
export const ExhibitConfigSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  /** Haupt-Modell der Ausstellung. */
  model: ExhibitModelSchema,
  /** HDRI environment preset (drei). */
  environment: z.string().default("studio"),
  /** ContactShadows aktivieren. */
  contactShadows: z.boolean().default(true),
  /** Default-Kameraposition [x, y, z]. */
  cameraPosition: z.tuple([z.number(), z.number(), z.number()]).default([0, 1.5, 4]),
  /** Hintergrundfarbe (CSS). */
  bgColor: z.string().default("#111111"),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type Tenant = z.infer<typeof TenantSchema>;
export type User = z.infer<typeof UserSchema>;
export type ModelVariant = z.infer<typeof ModelVariantSchema>;
export type Hotspot = z.infer<typeof HotspotSchema>;
export type ExhibitModel = z.infer<typeof ExhibitModelSchema>;
export type ExhibitConfig = z.infer<typeof ExhibitConfigSchema>;
