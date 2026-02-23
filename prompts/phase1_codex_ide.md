# Phase 1 Prompt - Codex IDE

Aufgabe: Phase 1D/E - Premium UI + Zustand Integration

Lies zuerst:
- `AGENTS.md`
- `docs/PHASE_1_EXECUTION_PLAN.md`
- `src/types/schema.ts`
- Bereits umgesetzte 3D-Komponenten unter `src/components/3d/`

Halte Senior-Regeln strikt ein:
- Checkbox-Tasks aktiv fuehren.
- Keine halbfertigen Uebergaben.
- Bei Blockade nichts kaputt machen; klar stoppen und Status melden.

Checkliste (im Chat aktiv fuehren):
- [ ] `src/store/exhibit.ts` sauber aufbauen:
  - `config`, `activeVariants`, `selectedHotspot`
  - Actions: `setConfig`, `setVariant`, `selectHotspot`, `clearHotspot`
- [ ] UI-Panels mit Glassmorphism bauen:
  - `src/components/ui/ConfiguratorPanel.tsx`
  - `src/components/ui/HotspotPanel.tsx`
  - Style-Richtung: `bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl`
- [ ] `src/app/page.tsx` als Premium Viewer-Seite:
  - 3D Fullscreen
  - Overlay-Panels schwebend ueber Szene
  - Keine schwere, klassische Dashboard-Chrome
- [ ] Interaktion verdrahten:
  - Hotspot-Auswahl zeigt Panel
  - Variant-Auswahl setzt aktive Varianten im Store
- [ ] UI-Qualitaet:
  - mobile + desktop layout nutzbar
  - keine TypeScript `any`s
- [ ] Build pruefen:
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Build-Status
- ggf. offene technische Risiken
