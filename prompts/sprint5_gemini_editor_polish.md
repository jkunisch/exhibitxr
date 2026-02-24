# Feature Sprint 5 – Gemini 3.1 (Antigravity IDE)
# Editor Polish: Lighting Studio + HDRI Switcher + Responsive

Lies zuerst:
- `GEMINI.md`
- `src/types/schema.ts`
- `src/components/editor/EditorShell.tsx`
- `src/components/editor/EditorForm.tsx`
- `src/components/3d/ViewerCanvas.tsx` (Environment Preset)
- `src/store/editorStore.ts`
- `src/hooks/useFirestoreExhibit.ts`

Strikte Regeln:
- TypeScript strict, kein `any`
- schema.ts NICHT aendern
- Editor muss responsive sein (Tablet: Stacked Layout)

Ziel: Den Editor visuell aufwerten und die Beleuchtungssteuerung als Premium-Feature einbauen.

Checkliste:

- [ ] HDRI Environment Switcher im Editor:
  - Visual Dropdown oder Thumbnail-Grid in EditorForm
  - Zeige alle drei/drei Presets als kleine Preview-Thumbnails:
    - studio, city, sunset, dawn, night, warehouse, forest, apartment, park, lobby
  - Klick → `onChange({ environment: preset })`
  - Aktiver Preset hervorgehoben (cyan border)

- [ ] Lighting Controls im Editor:
  - Abschnitt "Beleuchtung" in EditorForm:
    - Ambient Intensity Slider (0-2, step 0.1)
    - Background Color Picker (bereits vorhanden, polieren)
    - Contact Shadows Toggle (on/off)
  - Aenderungen sofort im 3D-Viewer sichtbar (via Zustand Store)
  - Speichern in Firestore ueber onChange

- [ ] Editor Responsive Layout:
  - Desktop (>1024px): Split-View wie jetzt (Form links, Viewer rechts)
  - Tablet (768-1024px): Viewer oben (50vh), Form unten (scrollbar)
  - Mobile (<768px): Nur Viewer mit Toggle-Button fuer Form-Drawer
  - Form-Drawer: Slide-in von unten, 80vh Hoehe, Handle zum Ziehen

- [ ] Editor Visual Polish:
  - Header-Bar oben: Exhibition Titel + Save Status + "Vorschau" Link (embed/[id])
  - Sidebar Sections collapsible (Chevron-Toggle)
  - Bessere Spacing und Typografie
  - Subtle Section-Dividers

- [ ] "Vorschau"-Button:
  - Link der den Embed-Viewer in neuem Tab oeffnet
  - `/embed/{exhibitId}` – zeigt genau was der Endkunde sieht
  - Icon: Lucide `ExternalLink`

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`
  - Responsive Test: 375px, 768px, 1440px

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Screenshots der neuen UI
