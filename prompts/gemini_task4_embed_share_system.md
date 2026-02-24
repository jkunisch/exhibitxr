# Gemini Deep Think — Task 4: Embed Widget System & Share Engine

## Kontext
Du arbeitest an **ExhibitXR**, einem B2B SaaS für interaktive 3D-Produkt-Showrooms.

**Stack:** Next.js 16, React 19, TailwindCSS 4, Three.js 0.183, R3F v9, TypeScript strict.

Lies `/.context.md` für vollständige Architektur.

## Auftrag
Das Embed-System ist der **Revenue Driver** von ExhibitXR: Kunden zahlen, damit ihre
3D-Showrooms auf beliebigen Websites eingebettet werden können.

Baue ein **professionelles Embed Widget System** mit Branding Controls, Responsive Behavior,
Screenshot/Share und einem Embed Builder im Dashboard.

---

## Architektur

### 1. `src/components/embed/EmbedChrome.tsx` (NEU — Client Component)

Professionelles Overlay-Chrome für den Embed Viewer:

**Top-Bar (optional, per Config):**
```
┌──────────────────────────────────────────────┐
│  Logo │ Titel                    │ Fullscreen │
└──────────────────────────────────────────────┘
```
- Tenant-Logo (URL aus Firestore Config) oder ExhibitXR Default-Logo
- Exhibition Title
- Fullscreen Toggle (lucide `Maximize2` / `Minimize2`)
- Glassmorphism: `bg-black/40 backdrop-blur-md`
- Auto-Hide nach 3s Inaktivität (Maus zeigt es wieder)

**Bottom-Bar:**
```
┌──────────────────────────────────────────────┐
│  [Variants] [AR] [Screenshots] [Share]       │
│                                   Powered by │
│                                   ExhibitXR  │
└──────────────────────────────────────────────┘
```
- Variant Switcher (existierende Logik, neues Design)
- AR Button (placeholder, zeigt "Coming Soon" Toast auf Mobile)
- Screenshot Button
- Share Button (Web Share API)
- "Powered by ExhibitXR" Branding (entfernbar im Pro-Plan — via Config boolean)

Alle Buttons: `pointer-events-auto` in einem `pointer-events-none` Container.

### 2. `src/components/embed/ScreenshotCapture.tsx` (NEU — Client Component)

Screenshot vom aktuellen 3D-View:

```typescript
function captureScreenshot(gl: THREE.WebGLRenderer): Promise<Blob> {
  // 1. Render einen Frame mit preserveDrawingBuffer (schon konfiguriert in ViewerCanvas)
  // 2. gl.domElement.toDataURL('image/png')
  // 3. Convert dataURL to Blob
  // 4. Return Blob für Download oder Share
}
```

**UI Flow:**
1. User klickt Screenshot-Button
2. Kurzer Flash-Effekt (weißer Overlay, 100ms, opacity 0→0.3→0)
3. Preview-Modal erscheint:
   ```
   ┌────────────────────────────┐
   │  ┌──────────────────────┐  │
   │  │   Screenshot Preview │  │
   │  └──────────────────────┘  │
   │                            │
   │  [Download] [Share] [Close]│
   └────────────────────────────┘
   ```
4. Download: `a.download = 'exhibitxr-{title}-screenshot.png'`
5. Share: `navigator.share({ files: [file] })` mit Fallback auf Clipboard

**Technisch:**
- Nutze `useThree()` um an den `gl` Renderer zu kommen
- `preserveDrawingBuffer: true` ist bereits in `ViewerCanvas.tsx` gesetzt ✓
- Resolution: Canvas-native (Retina-fähig durch DPR Setting)
- `useCallback` für den Capture, kein re-render des Canvas

### 3. `src/components/embed/ShareDialog.tsx` (NEU — Client Component)

Share-Optionen Dialog:

```
┌────────────────────────────────────┐
│  Teilen                        ✕  │
│                                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────────┐ │
│  │ 🔗 │ │ 📧 │ │ 🐦 │ │LinkedIn│ │
│  │Link│ │Mail│ │  X  │ │        │ │
│  └────┘ └────┘ └────┘ └────────┘ │
│                                    │
│  Embed-Code:                       │
│  ┌──────────────────────────────┐ │
│  │ <iframe src="..." .../>      │ │
│  │                    [Kopieren]│ │
│  └──────────────────────────────┘ │
│                                    │
│  Direktlink:                       │
│  ┌──────────────────────────────┐ │
│  │ exhibitxr.com/embed/abc123   │ │
│  │                    [Kopieren]│ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

**Share-Links:**
- Link: `navigator.clipboard.writeText(url)` + Toast "Kopiert!"
- Email: `mailto:?subject={title}&body=...`
- X/Twitter: `https://twitter.com/intent/tweet?url={url}&text=...`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`

**Embed-Code Builder:**
```typescript
function buildEmbedCode(id: string, options: EmbedOptions): string {
  const params = new URLSearchParams();
  if (options.autoRotate) params.set('autoRotate', '1');
  if (options.hideUI) params.set('hideUI', '1');
  if (options.bgColor) params.set('bg', options.bgColor);

  return `<iframe
  src="https://exhibitxr.com/embed/${id}?${params}"
  width="${options.width || '100%'}"
  height="${options.height || 600}"
  frameborder="0"
  allow="xr-spatial-tracking; fullscreen"
  loading="lazy"
  style="border: none; border-radius: 12px;"
></iframe>`;
}
```

### 4. `src/components/dashboard/EmbedBuilder.tsx` (NEU — Client Component)

Embed-Code Builder-Interface im Dashboard (bei Exhibition Detail oder als Modal):

- Live Preview (kleiner Iframe des eigenen Embed)
- Customization Controls:
  - Width/Height Input
  - Background Color Picker (vordefinierte Palette + Custom)
  - Auto-Rotate Toggle
  - Hide UI Toggle
  - Show Branding Toggle (nur Pro Plan)
- Generated Code aktualisiert sich live
- Copy-to-Clipboard Button mit Erfolgs-Feedback

```
┌─────────────────────────────────────────┐
│  Embed-Code Generator                   │
│                                          │
│  ┌──────────────────────┐  Einstellungen│
│  │                      │  ────────────│
│  │   Live Preview       │  Breite: 100%│
│  │   (mini iframe)      │  Höhe:  600px│
│  │                      │  ☑ Auto-Rot. │
│  └──────────────────────┘  ☐ UI verst. │
│                             ☑ Branding  │
│  ┌──────────────────────────────────────┐
│  │ <iframe src="...                     │
│  │   width="100%" height="600".../>     │
│  │                          [Kopieren]  │
│  └──────────────────────────────────────┘
└─────────────────────────────────────────┘
```

### 5. `src/app/embed/[id]/page.tsx` (MODIFIZIEREN)

Query-Parameter Support für Embed-Customization:
```typescript
// Parse URL params
const searchParams = await props.searchParams;
const autoRotate = searchParams?.autoRotate === '1';
const hideUI = searchParams?.hideUI === '1';
const bgColor = searchParams?.bg || config.bgColor;
```
Leite diese als Props an `EmbedViewer` weiter.

### 6. Fullscreen API Integration

In `EmbedChrome.tsx`:
```typescript
function toggleFullscreen(containerRef: RefObject<HTMLDivElement>) {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    containerRef.current?.requestFullscreen();
  }
}
```
- Fullscreen-Icon Toggle
- ESC Key Handler
- `fullscreenchange` Event Listener für State Sync

---

## Technische Anforderungen

1. **Web Share API**: Feature-detect mit `navigator.share`, Fallback auf manuelles Sharing
2. **Clipboard API**: `navigator.clipboard.writeText()` mit Fallback auf `document.execCommand`
3. **Fullscreen API**: Feature-detect, graceful Degradation auf Mobile
4. **Screenshot**: Nutze `preserveDrawingBuffer` (bereits gesetzt), `toDataURL('image/png')`
5. **URL Params**: Nutze Next.js `searchParams` (Server Component)
6. **TypeScript strict**: Kein `any`, saubere Interfaces
7. **Zero Dependencies**: Keine neuen packages
8. **Mobile**: Touch-freundlich, mindestens 44px Tap Targets
9. **Teste mit `npm run build`**

## Output
Vollständiger Code für alle 6 Dateien/Modifikationen. Kein Pseudocode.
