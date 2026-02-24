# Feature Sprint 4 – Claude Opus (Antigravity)
# Screenshot, Share & Social Preview

Lies zuerst:
- `.antigravity/rules`
- `src/components/3d/ViewerCanvas.tsx`
- `src/components/3d/EmbedViewer.tsx`
- `src/app/embed/[id]/page.tsx`

Strikte Regeln:
- R3F Canvas `gl.preserveDrawingBuffer = true` fuer Screenshot
- TypeScript strict, kein `any`
- Checkbox-Tasks aktiv fuehren

Checkliste:

- [ ] Canvas Screenshot Utility (`src/lib/screenshot.ts`):
  - Exportiere `captureCanvas(): Promise<Blob>`
  - Greift auf das R3F Canvas-Element zu (`document.querySelector('canvas')`)
  - `canvas.toDataURL('image/png')` → Blob konvertieren
  - Fallback: Wenn kein Canvas gefunden → Error werfen

- [ ] ViewerCanvas: `preserveDrawingBuffer` aktivieren:
  - In Canvas `gl` Props: `preserveDrawingBuffer: true`
  - ACHTUNG: Kann Performance leicht senken – nur wenn Screenshot-Feature aktiv

- [ ] Screenshot-Button in EmbedViewer:
  - Kamera-Icon (Lucide `Camera`)
  - Position: oben rechts, neben Cinematic und Exploded Toggles
  - Klick:
    1. Flash-Animation (kurzes weisses Overlay, 200ms)
    2. `captureCanvas()` aufrufen
    3. Download als `exhibitxr-screenshot.png`

- [ ] Share-Button in EmbedViewer:
  - Share-Icon (Lucide `Share2`)
  - Klick → Share-Popup mit:
    - Embed-URL (kopiierbar)
    - Direct Link zum Viewer
    - Social Icons: Twitter, LinkedIn, WhatsApp (Share-Intent URLs)
    - Copy-Button mit "Kopiert!" Feedback
  - Glassmorphism Popup, Position oben rechts

- [ ] Open Graph Metadata fuer Embed-Route (`embed/[id]/page.tsx`):
  - `generateMetadata()` Funktion (Next.js):
    - `title`: Exhibition Title
    - `description`: "Interaktive 3D-Ausstellung – {title}"
    - `openGraph.images`: Placeholder-Bild oder generiertes Thumbnail
    - `openGraph.type`: "website"
  - Damit Links auf Social Media ein schoenes Preview zeigen

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Offene Risiken (preserveDrawingBuffer Performance)
