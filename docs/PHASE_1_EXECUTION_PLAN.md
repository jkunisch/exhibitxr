# Phase 1 Execution Plan (Claude + Codex)

## Ziel
Phase 1 sauber aufteilen, damit Claude IDE und Codex IDE ohne Chaos arbeiten.

## Reihenfolge
1. Claude IDE: Bootstrap + Schema + Firebase Basis + 3D Core
2. Codex IDE: Premium UI Overlays + Panel-Logik + Integrations-Polish
3. Claude IDE: finaler 3D-Feinschliff (Kamerafahrten/Hotspot-Fokus)

## Owner-Matrix
- Claude IDE:
  - `src/types/schema.ts`
  - `src/lib/firebase.ts`
  - `src/lib/firebaseAdmin.ts`
  - `src/lib/validateConfig.ts`
  - `src/components/3d/*`
  - `src/data/demo.ts`
  - `src/app/embed/[id]/page.tsx`
- Codex IDE:
  - `src/components/ui/*`
  - `src/app/page.tsx` (Layout + Overlay-Komposition)
  - `src/store/exhibit.ts`

## Phase 1 Checkliste
- [ ] P1-A (Claude): Next.js 15 Scaffold + Dependencies
- [ ] P1-B (Claude): Premium Schema + Firebase Init + Validation
- [ ] P1-C (Claude): ViewerCanvas + ModelViewer + Demo Config + Embed Route
- [ ] P1-D (Codex): Glassmorphism Panels (Configurator + Hotspot)
- [ ] P1-E (Codex): Zustand Actions + UI-Integration
- [ ] P1-F (Claude): CameraControls Hotspot-Fahrt (`setLookAt(..., true)`)
- [ ] P1-G (Owner): `npm run build` gruen + manuelle Viewer-Pruefung

## Abnahme
- [ ] Modell sichtbar und drehbar
- [ ] ContactShadows + Environment aktiv
- [ ] Hotspot klickbar, Panel sichtbar
- [ ] Varianten schalten ohne harte Ruckler
- [ ] `/embed/demo` ohne Dashboard-Chrome
