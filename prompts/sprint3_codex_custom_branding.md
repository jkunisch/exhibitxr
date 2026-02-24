# Feature Sprint 3 – Codex IDE
# Custom Branding + Embed Theming

Lies zuerst:
- `AGENTS.md`
- `src/types/schema.ts`
- `src/components/3d/EmbedViewer.tsx`
- `src/app/embed/[id]/page.tsx`
- `src/app/(dashboard)/dashboard/exhibitions/[id]/`
- `firebase/firestore.rules`

Strikte Regeln:
- Run `npm run build` after modifying TypeScript files
- TypeScript strict, kein `any`
- Tailwind fuer UI
- schema.ts NICHT aendern – Branding-Config in separatem Firestore-Feld

Ziel: Kunden koennen ihr eigenes Logo, Farben und Schriftart fuer den Embed-Viewer setzen.

Checkliste:

- [ ] Branding-Type definieren (NICHT in schema.ts – eigenes Interface):
  Erstelle `src/types/branding.ts`:
  ```
  interface EmbedBranding {
    logoUrl?: string;       // URL zum Logo (oben links)
    primaryColor?: string;  // Akzentfarbe (Buttons, Hotspot-Glow)
    fontFamily?: string;    // Google Font Name oder 'system-ui'
    hideWatermark?: boolean; // ExhibitXR Wasserzeichen ausblenden (nur Pro)
    customCss?: string;     // Optional: custom CSS injection (nur Enterprise)
  }
  ```

- [ ] Branding in Firestore speichern:
  - Feld `branding` im Exhibition-Dokument (optional, partial)
  - Firestore-Pfad: `/tenants/{tenantId}/exhibitions/{exhibitId}.branding`
  - Server Action: `updateBrandingAction(exhibitId, branding: Partial<EmbedBranding>)`

- [ ] Branding-Editor im Dashboard (`exhibitions/[id]/branding/page.tsx`):
  - Logo-Upload (Firebase Storage, Pfad: `tenants/{tenantId}/branding/logo.png`)
  - Color-Picker fuer `primaryColor`
  - Font-Selector: Dropdown mit 5-6 Google Fonts (Inter, Outfit, Roboto, Poppins, Space Grotesk, system-ui)
  - Toggle: "ExhibitXR Wasserzeichen ausblenden" (disabled fuer Free-Plan)
  - Live-Preview: Mini-Embed neben dem Formular
  - Save-Button → `updateBrandingAction()`

- [ ] EmbedViewer Branding anwenden:
  - `EmbedViewer.tsx`: neues Prop `branding?: EmbedBranding`
  - Logo rendern (oben links, ueber dem Titel, max 120x40px)
  - `primaryColor` auf Hotspot-Glow, Variant-Switcher borders, Chat-Akzent anwenden
  - Font via `<style>` oder CSS Variable injizieren
  - Wenn `hideWatermark !== true`: kleines "Powered by ExhibitXR" unten links

- [ ] Embed-Route Branding laden (`embed/[id]/page.tsx`):
  - Branding-Daten aus Firestore Exhibition-Dokument lesen
  - Als Props an EmbedViewer weiterreichen

- [ ] "Powered by ExhibitXR" Watermark:
  - Immer anzeigen bei Free-Plan
  - Dezent: 10px Text unten links, opacity 0.4, Link zu exhibitxr.app
  - Nicht entfernbar per CSS (z-index + pointer-events)

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Screenshots
