# Phase 3 Prompt - Claude IDE

Aufgabe: Realtime Editor (Form <-> Firestore <-> Zustand <-> 3D Viewer)

Lies zuerst:
- `.antigravity/rules`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `src/types/schema.ts`
- `src/store/exhibit.ts`
- bestehende `src/components/3d/*`

Strikte Regeln:
- Checkbox-Tasks aktiv fuehren (`- [ ]`, `- [x]`).
- `useFrame`: nur transient reads (`getState()`), kein setState.
- Kein rohes Chaos in Three.js; Drei-Helfer bevorzugen.

Checkliste:
- [ ] `src/app/(dashboard)/editor/[id]/page.tsx` erstellen:
  - Split-Layout: links Formular, rechts Viewer
- [ ] Realtime Sync:
  - Firestore `onSnapshot` auf Exhibition-Dokument
  - Snapshot -> `setConfig` im Zustand Store
  - Formular-Aenderung -> debounced update nach Firestore
- [ ] Viewer-Anbindung:
  - nutzt bestehendes `ViewerCanvas` / `ModelViewer`
  - Hotspots + Varianten live aktualisiert ohne Full-Reload
- [ ] Kamera-UX:
  - Hotspot-Klick -> weiche Fahrt mit `CameraControls.setLookAt(..., true)`
- [ ] Stabilitaet:
  - Offline/Write-Fehler im UI sichtbar machen
  - Konflikte/Last-write-wins klar behandeln
- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Offene Risiken
