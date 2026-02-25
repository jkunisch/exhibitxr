# ExhibitXR – Gemini Deep Think: Vollständige Produkt- & Marktanalyse

## Kontext & Projektbeschreibung

Du analysierst **ExhibitXR** – eine SaaS-Plattform für interaktive 3D-Produkt-Showrooms im Web. Die Plattform richtet sich primär an **mittelständische Unternehmen (KMU)** und größere Firmen im DACH-Raum, die ihre physischen Produkte online als 3D-Erlebnis präsentieren wollen – ohne Coding-Kenntnisse.

### Was ExhibitXR macht

- **3D-Viewer im Browser:** Kunden können Produkte in einem interaktiven 3D-Viewer drehen, zoomen und aus allen Perspektiven betrachten. Embed per iFrame in jede Website.
- **Foto → 3D Pipeline:** Benutzer laden ein Produktfoto hoch, und die KI (Meshy API, meshy-6 Modell) generiert automatisch ein texturiertes 3D-Modell daraus (GLB-Format).
- **Dashboard & Editor:** Multi-Tenant SaaS mit Firebase Auth. Benutzer erstellen Ausstellungen, laden 3D-Modelle hoch oder generieren sie per KI, und veröffentlichen sie als embed-fähige Showrooms.
- **Cinematic Viewer:** Automatische Kamera-Choreografie (Orbit, Showcase-Modus) mit dynamischem Lighting, Post-Processing und smooth Transitions.
- **Hotspot-System:** Interaktive Marker im 3D-Raum mit Info-Popups.

### Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **3D Engine:** React Three Fiber (R3F), Three.js, @react-three/drei
- **Backend:** Firebase (Auth, Firestore, Storage), Server Actions
- **3D-Generierung:** Meshy API v1 (meshy-6 AI Model), GLB/glTF
- **Optimierung:** @gltf-transform (Draco-Kompression, Mesh-Dedup, PBR)
- **Styling:** Tailwind CSS 4, Responsive Design
- **State Management:** Zustand Stores (cinematicStore, editorStore, exhibitStore)
- **Hosting:** Vercel (geplant)

### Aktuelle Architektur (Dateien)

```
src/
├── app/
│   ├── page.tsx                    # Landing Page (Hero mit 3D-Viewer Demo)
│   ├── globals.css                 # Tailwind + Theme
│   ├── actions/generate3d.ts       # Server Actions: submitImage, checkStatus, finalizeModel
│   ├── (dashboard)/dashboard/      # Dashboard (Ausstellungen verwalten)
│   ├── (dashboard)/editor/         # Editor (Ausstellung bearbeiten, 3D hochladen/generieren)
│   ├── embed/[id]/                 # Public Embed Route (iFrame-fähig)
│   ├── login/ & register/          # Firebase Auth
├── components/
│   ├── 3d/
│   │   ├── EmbedViewer.tsx         # Embed-fähiger 3D-Viewer (mit Cinematic-Steuerung)
│   │   ├── ModelViewer.tsx         # Basis 3D-Viewer (Editor-Modus)
│   │   ├── ViewerCanvas.tsx        # R3F Canvas Wrapper
│   │   ├── CinematicController.tsx # Kamera-Choreografie (Orbit, Showcase, Idle)
│   │   ├── DynamicLightRig.tsx     # Dynamisches Beleuchtungssystem
│   │   ├── PostProcessing.tsx      # Post-FX (Bloom, Exposure)
│   │   └── HotspotMarker.tsx       # Interaktive 3D-Marker
│   ├── editor/                     # Editor-Komponenten
│   ├── dashboard/                  # Dashboard-Komponenten
│   ├── ui/
│   │   └── ModelGeneratorPanel.tsx  # Foto→3D Upload & Progress UI
├── lib/
│   ├── meshy.ts                    # Meshy API Client (Submit, Poll)
│   ├── glbOptimizer.ts             # GLB-Optimierung via @gltf-transform
│   ├── firebase.ts                 # Client Firebase
│   ├── firebaseAdmin.ts            # Server-Side Firebase Admin
│   └── storage.ts                  # Firebase Storage Helpers
├── store/
│   ├── cinematicStore.ts           # Cinematic Engine State (orbit/showcase/idle)
│   ├── editorStore.ts              # Editor State
│   └── exhibit.ts                  # Exhibit Data Types
```

---

## Deine Aufgabe (Deep Think)

Analysiere das gesamte Projekt gründlich und erstelle einen umfassenden Research-Report mit folgenden Schwerpunkten:

### 1. Produktbewertung & Status Quo
- Was funktioniert bereits gut?
- Was sind die offensichtlichen Lücken/Schwächen?
- Ist die Architektur skalierbar?
- Wie ist die Developer Experience (DX)?

### 2. Alleinstellungsmerkmale (USP)
- Was unterscheidet ExhibitXR von der Konkurrenz?
- Welche USPs sollten wir stärker hervorheben?
- Welche USPs fehlen noch und wären Game-Changer?

### 3. Wettbewerbsanalyse (DACH + Global)
Analysiere die folgenden und weitere relevante Wettbewerber:
- **Sketchfab** (3D-Viewer-Plattform, jetzt Teil von Epic Games)
- **Threekit** (3D-Produktkonfigurator, Enterprise)
- **Vectary** (3D-Design + Embed)
- **Roomle** (Österreich, 3D-Konfigurator für Möbel)
- **Rooom** (Deutschland, Virtual Showrooms)
- **Avataar.me** (AI-basierte 3D-Generierung)
- **Hexa / Amazon 3D** (E-Commerce 3D)
- **Shopify 3D** (integrierte 3D-Viewer)

Für jeden Wettbewerber: Stärken, Schwächen, Pricing, Zielgruppe, was wir besser machen (könnten).

### 4. Fehlende Features (Priorisiert)
Erstelle eine priorisierte Liste (Must-Have → Nice-to-Have) von Features die ExhibitXR braucht, um markttauglich zu sein:

Denke dabei an:
- **AR-Integration** (WebXR, AR Quick Look für iOS/Android)
- **Produkt-Konfigurator** (Material-/Farbwechsel, Varianten)
- **Analytics** (Wie lange schauen Kunden welches Produkt an?)
- **E-Commerce Integration** (Shopify, WooCommerce, Warenkorb)
- **Team/Multi-User** (Rollen, Berechtigungen)
- **White-Label / Custom Branding**
- **API für Drittanbieter**
- **Performance & SEO** (SSR, OG-Images, Lighthouse)
- **Multi-Language / i18n**
- **Batch-Upload** (mehrere Modelle gleichzeitig)
- **Annotationen / Guided Tours**
- **Video-Export** (Cinematic als MP4)
- **Custom Domains** für Embeds
- **QR-Code Generator** für physische Produkte → 3D-Link

### 5. Zielgruppen & Go-to-Market
- Welche Branchen profitieren am meisten? (Möbel, Automotive, Maschinenbau, Mode, Schmuck, Industrie, Museen...)
- Wie sollte die Pricing-Strategie aussehen? (Freemium, Pro, Enterprise)
- Welche Vertriebskanäle sind am effektivsten?
- Wie erreichen wir die ersten 100 zahlenden Kunden?

### 6. Technische Empfehlungen
- Welche technischen Schulden siehst du im Code?
- Was sollte sofort refactored werden?
- Welche Third-Party Services sollten wir evaluieren? (z.B. Tripo3D statt Meshy für schnellere Generation)
- Skalierungs-Strategie: Firebase vs. eigenes Backend?

### 7. Monetarisierung
- Welches Pricing-Modell macht Sinn?
- Was sind realistische ARR-Ziele für Jahr 1-3?
- Welche Premium-Features generieren den meisten Upsell?

---

## Format der Antwort

Erstelle einen strukturierten, detaillierten Report im Markdown-Format. Nutze Tabellen für Vergleiche, priorisierte Listen für Features, und konkrete Empfehlungen mit Begründung. Denke wie ein erfahrener Product Manager + CTO der ein SaaS-Startup im 3D/AR-Bereich aufbaut.

**Wichtig:** Sei brutal ehrlich. Sag mir was schlecht ist, was fehlt, und wo die größten Risiken liegen. Kein Sugar-Coating.

---

## Anhang: ZIP des aktuellen Codes

Im Anhang findest du den vollständigen Quellcode als ZIP-Datei. Schau dir insbesondere an:
1. `src/app/page.tsx` – Landing Page (erster Eindruck)
2. `src/components/3d/EmbedViewer.tsx` – Der Kern-Viewer
3. `src/components/ui/ModelGeneratorPanel.tsx` – Die Foto→3D Pipeline UI
4. `src/lib/meshy.ts` – API-Integration
5. `src/store/cinematicStore.ts` – Cinematic Engine
