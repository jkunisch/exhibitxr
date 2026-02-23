# Phase 1 Prompt - Claude IDE

Aufgabe: Phase 1A/B/C - Bootstrap + Premium Schema + 3D Core

Lies zuerst:
- `.antigravity/rules`
- `AGENTS.md`
- `GEMINI.md`
- `src/types/schema.ts`

Halte Senior-Regeln strikt ein:
- Kein `firebase-admin` in `middleware.ts` (Edge-safe).
- Nach Custom Claim Set immer `await user.getIdToken(true)`.
- `tenantId` ist Organisations-ID, nie User-`uid`.
- Storage default tenant-protected.

Checkliste (im Chat aktiv fuehren):
- [ ] Next.js 15 App initialisieren:
  - `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
  - Lokale Regeldateien (`*.md`, `.antigravity`) NICHT ueberschreiben.
- [ ] Dependencies installieren:
  - `npm install three @types/three @react-three/fiber@rc @react-three/drei@rc zustand zod firebase firebase-admin lucide-react clsx tailwind-merge framer-motion next-firebase-auth-edge --legacy-peer-deps`
- [ ] `src/types/schema.ts` erweitern:
  - Bestehende `TenantSchema` und `UserSchema` beibehalten.
  - Hinzufuegen: `ModelVariantSchema` mit optional `roughness`, `metalness`.
  - Hinzufuegen: `HotspotSchema` mit optional `cameraPosition`, `cameraTarget`.
  - Hinzufuegen: `ExhibitModelSchema`, `ExhibitConfigSchema`.
  - Alle inferierten Types exportieren.
- [ ] `src/lib/firebase.ts` erstellen:
  - Exporte: `app`, `auth`, `db`, `storage`.
  - `getApps().length` Guard.
  - Config aus `NEXT_PUBLIC_FIREBASE_*`.
- [ ] `src/lib/firebaseAdmin.ts` erstellen:
  - `FIREBASE_SERVICE_ACCOUNT_KEY` per `JSON.parse`.
  - Admin Init server-side only.
- [ ] `src/lib/validateConfig.ts` erstellen:
  - `parseExhibitConfig(input: unknown)` mit Zod + brauchbarem Fehlertext.
- [ ] 3D-Core erstellen:
  - `src/components/3d/ViewerCanvas.tsx`
  - `src/components/3d/ModelViewer.tsx`
  - Pflicht: `Environment`, `ContactShadows`, `OrbitControls` oder `CameraControls`.
- [ ] Demo/Route:
  - `src/data/demo.ts` mit validem Premium-Config-Beispiel.
  - `src/app/embed/[id]/page.tsx` als schlanker iframe-Viewer.
- [ ] Build pruefen:
  - `npm run build`

Ergebnisformat:
- Kurzer Abschluss mit:
  - erledigte Checkboxen
  - ggf. offene Punkte
  - Build-Status
