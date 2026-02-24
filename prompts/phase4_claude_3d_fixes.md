# Phase 4A – Claude Opus (Antigravity)
# 3D-Fixes: HotspotMarker, PerformanceMonitor, Store-Konsolidierung

Lies zuerst:
- `.antigravity/rules`
- `src/types/schema.ts`
- `src/components/3d/ViewerCanvas.tsx`
- `src/components/3d/ModelViewer.tsx`
- `src/store/exhibit.ts` (Landing-Page Store, alte Types)
- `src/store/editorStore.ts` (Editor Store, schema.ts Types)
- `src/app/page.tsx` (Landing Page nutzt exhibit.ts)

Strikte Regeln:
- useFrame: nur `getState()`, kein setState
- Drei-Helfer bevorzugen (Html, useGLTF, etc.)
- Checkbox-Tasks aktiv fuehren

Checkliste:

- [ ] 3D HotspotMarker erstellen (`src/components/3d/HotspotMarker.tsx`):
  - `'use client'` Komponente
  - Props: `hotspot: Hotspot` (aus schema.ts)
  - Nutze `<Html>` von `@react-three/drei` fuer HTML im 3D-Raum
  - Pulsierender Kreis (CSS animation) an `hotspot.position` [x,y,z]
  - Klick → Callback `onSelect(hotspot.id)`
  - Label als kleines Tooltip bei Hover

- [ ] PerformanceMonitor in `ViewerCanvas.tsx` einbauen:
  - `<PerformanceMonitor>` von `@react-three/drei`
  - FPS < 35 → `dpr` auf 1 setzen, Schatten deaktivieren
  - FPS > 50 → `dpr` zurueck auf default
  - State via `useState` oder `useRef` (NICHT Zustand Store)

- [ ] `ModelViewer.tsx` erweitern:
  - Hotspots als `<HotspotMarker>` Komponenten rendern (3D, nicht 2D-Overlay)
  - Material-Varianten via `scene.traverse()` + meshName-Matching
  - Meshes mit Prefix "VAR__" als konfigurierbar erkennen

- [ ] Store-Konsolidierung – `exhibit.ts` auf schema.ts Types migrieren:
  - `ExhibitVariant` → nutze `ModelVariant` aus schema.ts
  - `ExhibitHotspot` (2D {x,y}) → nutze `Hotspot` aus schema.ts (3D [x,y,z])
  - `ExhibitConfig` → nutze `ExhibitConfig` aus schema.ts
  - Landing Page (`page.tsx`) DEMO_CONFIG anpassen auf neue Types
  - ConfiguratorPanel und HotspotPanel auf neue Types updaten
  - ACHTUNG: `editorStore.ts` NICHT aendern, der ist schon korrekt

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien (Pfad + was geaendert wurde)
- Offene Risiken
