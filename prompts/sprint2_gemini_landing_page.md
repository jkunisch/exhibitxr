# Feature Sprint 2 – Gemini 3.1 (Antigravity IDE)
# Landing Page – Premium Marketing Site

Lies zuerst:
- `GEMINI.md`
- `src/types/schema.ts`
- `src/app/page.tsx` (aktuelle Hauptseite)
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/3d/EmbedViewer.tsx`
- `src/data/demo.ts`

Strikte Regeln:
- Server Components by default, `'use client'` nur wo interaktiv noetig
- Tailwind fuer alles, kein Shadcn/UI (zu generisch fuer Marketing)
- Mobile-First, responsive
- TypeScript strict

Ziel: Eine Landing Page die beim ersten Blick WOW erzeugt – Niveau wie rooom.com oder sketchfab.com.

Checkliste:

- [ ] Hero Section (`src/app/page.tsx` komplett neu):
  - Fullscreen Hero mit eingebettetem 3D-Viewer (Demo-Config)
  - Grosser Headline: "3D-Ausstellungen fuer das Web"
  - Sub-Headline: "Erstellen Sie interaktive Produkt-Showrooms – ohne Coding."
  - CTA-Button: "Kostenlos starten" → Link zu `/register`
  - 3D-Viewer nimmt ~60% der Hoehe ein, darunter Gradient-Fade zum naechsten Abschnitt
  - Dunkler Hintergrund (#0a0a0f oder aehnlich), premium Aesthetik

- [ ] Features Section:
  - 3-Spalten Grid (Mobile: 1-Spalte)
  - Feature-Cards mit Icons (Lucide):
    - 🎨 "Konfigurator" – Farben und Materialien live wechseln
    - 📍 "Hotspots" – Interaktive Info-Punkte im 3D-Raum
    - 🤖 "KI-Chat" – Produktberater direkt im Viewer
    - 🔗 "Embed" – Per iframe auf jeder Website einbinden
    - 📱 "Responsive" – Funktioniert auf Desktop, Tablet, Mobile
    - ⚡ "Echtzeit-Editor" – Aenderungen sofort sichtbar
  - Glassmorphism Cards (bg-white/5, backdrop-blur, border-white/10)

- [ ] Social Proof / Trust Section:
  - "Fuer Hersteller, Museen und Showrooms"
  - 3 Fake-Testimonial Cards oder Usecase-Beschreibungen
  - Dezente Logos oder Platzhalter

- [ ] Pricing Section:
  - 3-Tier Pricing Tabelle: Free / Starter (29€) / Pro (99€)
  - Feature-Vergleich als Tabelle
  - CTA pro Plan: "Starten" / "7 Tage testen" / "Kontakt"
  - Highlighted Empfehlung (Starter oder Pro)

- [ ] Footer:
  - Logo, Links (Impressum, Datenschutz, Kontakt)
  - "Made with ❤️ in Mannheim"

- [ ] Styling (`src/app/globals.css` erweitern):
  - Google Font: Inter oder Outfit (via next/font/google)
  - Custom Properties: --color-primary: #00aaff, --color-bg: #0a0a0f
  - Smooth Scroll Behavior
  - Dezente Scroll-Animationen (IntersectionObserver basiert, kein schweres Library)

- [ ] Navigation:
  - Sticky Navbar: Logo links, Links mitte (Features, Pricing), CTA rechts
  - Transparent auf Hero, solid auf Scroll
  - Mobile: Hamburger Menu

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`
  - Responsive Test: Mobile (375px), Tablet (768px), Desktop (1440px)

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Screenshots der Sections
