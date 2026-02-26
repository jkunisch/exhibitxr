import type { ExhibitConfig } from "@/types/schema";

// ─── Khronos glTF Sample Models (always available, CDN-hosted) ──────────────
const KHRONOS_CDN =
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models";

// ─── Demo Configs ───────────────────────────────────────────────────────────

/**
 * 1. Cyber-Gear — Sci-Fi Helmet (PBR showpiece with metallic reflections)
 */
export const demoConfig: ExhibitConfig = {
    id: "demo",
    tenantId: "demo-tenant",
    title: "Cyber-Gear Configurator",
    model: {
        id: "helmet-model",
        label: "Damaged Helmet",
        glbUrl: `${KHRONOS_CDN}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
        scale: 2.5,
        position: [0, 0.3, 0],
        variants: [
            {
                id: "battle-scarred",
                label: "Battle Scarred",
                meshTargets: ["mesh_helmet_LP_13930damagedHelmet"],
                roughness: 0.6,
                metalness: 0.8,
            },
            {
                id: "chrome-finish",
                label: "Chrome Finish",
                meshTargets: ["mesh_helmet_LP_13930damagedHelmet"],
                color: "#c0c0c0",
                roughness: 0.1,
                metalness: 1.0,
            },
        ],
        hotspots: [
            {
                id: "visor",
                label: "Tactical Visor",
                description:
                    "Reinforced polycarbonate visor with HUD overlay capability.",
                position: [0, 0.05, 0.45],
                cameraPosition: [0.8, 0.3, 1.2],
                cameraTarget: [0, 0, 0],
            },
            {
                id: "ventilation",
                label: "Cooling System",
                description:
                    "Integrated air-duct system maintains optimal temperature under load.",
                position: [-0.35, 0.15, 0.1],
                cameraPosition: [-1.2, 0.5, 0.8],
                cameraTarget: [0, 0.1, 0],
            },
        ],
    },
    environment: "city",
    envRotation: 0,
    ambientIntensity: 0.8,
    contactShadows: true,
    autoRotate: false,
    cameraPosition: [0, 0.5, 3],
    bgColor: "#0a0a0f",
};

/**
 * 2. Industrial / Precision Engineering — Flight Helmet
 *    (B2B demo: shows Hotspots on technical equipment)
 */
export const industrialDemoConfig: ExhibitConfig = {
    id: "demo-industrial",
    tenantId: "demo-tenant",
    title: "Industrial Precision Viewer",
    model: {
        id: "flight-helmet-model",
        label: "Flight Helmet",
        glbUrl: `${KHRONOS_CDN}/FlightHelmet/glTF/FlightHelmet.gltf`,
        scale: 5,
        position: [0, -0.2, 0],
        variants: [],
        hotspots: [
            {
                id: "oxygen-mask",
                label: "Oxygen Mask System",
                description:
                    "MIL-SPEC oxygen delivery with automatic altitude compensation.",
                position: [0, -0.1, 0.2],
                cameraPosition: [0.5, 0.1, 1],
                cameraTarget: [0, -0.1, 0],
            },
            {
                id: "comms",
                label: "Communications Array",
                description:
                    "Dual-channel encrypted comms with active noise cancellation.",
                position: [0.2, 0.15, 0],
                cameraPosition: [1, 0.5, 0.5],
                cameraTarget: [0, 0.1, 0],
            },
        ],
    },
    environment: "warehouse",
    envRotation: 0,
    ambientIntensity: 0.8,
    contactShadows: true,
    autoRotate: false,
    cameraPosition: [0, 0.5, 2.5],
    bgColor: "#111111",
};

/**
 * 3. Automotive / Luxury — Vintage Car (Corolla or similar)
 *    Uses the AntiqueCamera as a stand-in for precision mechanical showcase.
 */
export const automotiveDemoConfig: ExhibitConfig = {
    id: "demo-automotive",
    tenantId: "demo-tenant",
    title: "Luxury Engineering Showcase",
    model: {
        id: "antique-camera-model",
        label: "Precision Optics",
        glbUrl: `${KHRONOS_CDN}/AntiqueCamera/glTF/AntiqueCamera.gltf`,
        scale: 0.08,
        position: [0, 0, 0],
        variants: [],
        hotspots: [
            {
                id: "lens",
                label: "Precision Lens Assembly",
                description:
                    "Hand-ground optical glass with multi-element coated design.",
                position: [0, 5, 10],
                cameraPosition: [15, 10, 20],
                cameraTarget: [0, 5, 0],
            },
        ],
    },
    environment: "studio",
    envRotation: 0,
    ambientIntensity: 0.8,
    contactShadows: true,
    autoRotate: false,
    cameraPosition: [0, 1.5, 4],
    bgColor: "#1a1a1a",
};