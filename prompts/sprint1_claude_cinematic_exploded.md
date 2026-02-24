# Feature Sprint 1 – Claude Opus (Antigravity)
# Cinematic Showcase Mode + Exploded View

Lies zuerst:
- `.antigravity/rules`
- `src/types/schema.ts`
- `src/components/3d/ViewerCanvas.tsx` (CameraControls + PerformanceMonitor)
- `src/components/3d/ModelViewer.tsx` (VAR__ discovery, HotspotMarker)
- `src/components/3d/EmbedViewer.tsx`
- `src/store/editorStore.ts`

Strikte Regeln:
- useFrame mit Delta, getState() fuer Zustand
- Drei-Helfer nutzen (CameraControls.setLookAt)
- TypeScript strict, kein `any`
- Checkbox-Tasks aktiv fuehren

## Teil 1: Cinematic Showcase Mode

- [ ] Erstelle `src/components/3d/CinematicCamera.tsx`:
  - `'use client'` Komponente
  - Props: `enabled: boolean`, `cameraControlsRef: RefObject<CameraControls>`
  - Wenn enabled: smooth orbitale Kamerafahrt um das Modell
  - useFrame mit Delta:
    - Berechne Position auf einem Kreis (radius ~3, height oscilliert sanft)
    - `cameraControlsRef.current.setLookAt(x, y, z, 0, 0.5, 0, false)` pro Frame
    - Geschwindigkeit: ~10 Grad/Sekunde
  - Wenn User manuell interagiert (Maus/Touch) → Cinematic automatisch pausieren
  - Resume nach 5 Sekunden Inaktivitaet

- [ ] Toggle-Button in `EmbedViewer.tsx`:
  - Kino-Icon (Lucide `Clapperboard` oder `Film`)
  - Position: oben rechts neben dem Titel
  - Toggled `cinematicEnabled` State
  - Glassmorphism-Button (konsistent mit Variant-Switcher)

## Teil 2: Exploded View

- [ ] Erstelle `src/components/3d/ExplodedView.tsx`:
  - `'use client'` Komponente
  - Props: `scene: THREE.Group`, `exploded: boolean`, `factor: number` (0-1)
  - Bei `exploded=true`: Jedes Top-Level-Mesh verschiebt sich radial nach aussen
  - Berechnung:
    - BoundingBox Center des Gesamtmodells
    - Fuer jedes Mesh: Richtung = mesh.position - center (normalisiert)
    - Neue Position = originalPosition + direction * factor * explosionRadius
  - `factor` ist animiert (0→1 ueber ~800ms, easeOutCubic)
  - Speichere Original-Positionen in useRef beim ersten Render

- [ ] Integration in `ModelViewer.tsx`:
  - `exploded` State (boolean)
  - Wenn exploded: `<ExplodedView>` Wrapper um `<primitive>`
  - HotspotMarker bleiben an ihren 3D-Positionen (verschieben sich mit)

- [ ] Toggle-Button in `EmbedViewer.tsx`:
  - Explosions-Icon (Lucide `Layers` oder `Maximize2`)
  - Position: oben rechts, neben Cinematic-Toggle
  - Toggled `explodedEnabled` State

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Offene Risiken (z.B. GLBs mit flacher Hierarchie)
