import type { ExhibitConfig } from "@/types/schema";

/**
 * Demo-Konfiguration mit einem oeffentlichen GLB-Modell.
 * Nutzt das Shoe-Modell aus der drei.js-Beispiel-Bibliothek.
 */
export const demoConfig: ExhibitConfig = {
    id: "demo",
    tenantId: "demo-tenant",
    title: "Premium Sneaker Showcase",
    model: {
        id: "shoe-model",
        label: "Sneaker",
        glbUrl: "https://vazxmixjsiez.usemoralis.com/shoe/shoe.glb",
        scale: 3,
        position: [0, 0.5, 0],
        variants: [
            {
                id: "midnight-black",
                label: "Midnight Black",
                meshTargets: ["shoe", "shoe_1", "shoe_2"],
                color: "#1a1a2e",
                roughness: 0.3,
                metalness: 0.1,
            },
            {
                id: "arctic-white",
                label: "Arctic White",
                meshTargets: ["shoe", "shoe_1", "shoe_2"],
                color: "#f0f0f0",
                roughness: 0.5,
                metalness: 0.0,
            },
        ],
        hotspots: [
            {
                id: "sole",
                label: "Cushioned Sole",
                description: "Premium EVA foam provides all-day comfort and energy return.",
                position: [0, -0.05, 0.15],
                cameraPosition: [1.5, 0.5, 2],
                cameraTarget: [0, 0, 0],
            },
            {
                id: "upper",
                label: "Flyknit Upper",
                description: "Breathable engineered knit adapts to your foot shape.",
                position: [0, 0.08, -0.05],
                cameraPosition: [-1, 1.5, 2],
                cameraTarget: [0, 0.1, 0],
            },
        ],
    },
    environment: "studio",
    contactShadows: true,
    cameraPosition: [0, 1.5, 4],
    bgColor: "#111111",
};