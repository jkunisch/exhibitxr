# ExhibitXR - Agent Instructions

## Projekt
ExhibitXR: B2B SaaS — Firmen laden Produktfotos hoch, Meshy AI generiert
realistische 3D-Modelle, die als interaktive Web-Showrooms eingebettet werden.

## ZUERST LESEN
- `/.context.md` — Vollstaendige Architektur, Status, Regeln, API-Keys
- `/src/types/schema.ts` — Single Source of Truth fuer alle Typen

## Stack
- Next.js 16 (App Router), TypeScript strict, React 19
- React Three Fiber v9 RC + @react-three/drei v10 RC
- Zustand 5, Firebase (Firestore + Auth + Storage)
- TailwindCSS 4 + Framer Motion, Zod

## Aktuelle Prioritaet
**Kernprodukt: Foto→3D Pipeline zum Laufen bringen**
- `ModelGeneratorPanel` in `EditorShell` Sidebar einbauen
- Pipeline live testen (Meshy API Key ist gesetzt)
- GLB-Qualitaet und Optimizer-Parameter pruefen

## Rules
- Run `npm run build` after modifying TypeScript files
- Lies immer `src/types/schema.ts` UND `/.context.md` bevor du Code schreibst
- Aendere `src/types/schema.ts` niemals ohne explizite Erlaubnis
- TypeScript strict: kein `any`
- Nutze `@react-three/drei` statt roher Three.js-Mathe
- In `useFrame`: nur `useStore.getState()`, nie `setState`
- Alle 3D-Komponenten: `'use client'`
- Server Components by default; `'use client'` nur wo noetig
- Firebase Client SDK nur in `'use client'` Komponenten
- Firebase Admin SDK nur in Server Actions / API Routes / server-side auth checks
- Auth im App Router ueber Session-Cookies (SSR-freundlich)
- Multi-Tenancy ueber Custom Claims (`tenantId`) erzwingen
- Aufgaben immer als Checkbox-Liste fuehren (`- [ ]` / `- [x]`)
- Fehler immer selbst fixen; wenn blockiert, sauber stoppen
- Commit-Format: `feat|fix|chore: kurze beschreibung`

## Senior Architektur-Regeln (Strikt)
- Next.js Middleware ist Edge-Runtime: `firebase-admin` niemals in `middleware.ts`.
- Middleware darf nur auf Session-Cookie-Existenz pruefen.
- Nach Setzen von Custom Claims via Admin SDK muss der Client immer `await user.getIdToken(true)` ausfuehren.
- Multi-Tenancy als Membership-Modell: `tenantId` ist eine separate UUID, nie `uid`.
- Schema so halten, dass mehrere User denselben Tenant teilen koennen (Team-Accounts).
- Storage-Sicherheit B2B-first: keine pauschalen public-reads.
- Beim Upload Custom Metadata setzen (z.B. `isPublished: "false"`).

## Dateistruktur
- `src/types/schema.ts` -> NICHT aendern (Zod Schemas)
- `src/lib/meshy.ts` -> Meshy API Client (submitImageTo3D, pollTaskStatus)
- `src/lib/glbOptimizer.ts` -> GLB Pipeline (dedup, weld, simplify, draco)
- `src/app/actions/generate3d.ts` -> Server Actions (submit, check, finalize)
- `src/components/ui/ModelGeneratorPanel.tsx` -> Foto-Upload + Progress UI
- `src/components/3d/` -> R3F Komponenten (ViewerCanvas, ModelViewer, EmbedViewer)
- `src/components/editor/` -> Editor (EditorShell, EditorForm)
- `src/store/editorStore.ts` -> Zustand Editor State
- `src/app/(dashboard)/` -> Admin Dashboard
- `src/app/embed/[id]/` -> Embeddable Viewer (public)
