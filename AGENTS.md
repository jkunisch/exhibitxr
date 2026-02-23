# ExhibitXR - Codex Agent Instructions

## Projekt
ExhibitXR: B2B SaaS fuer interaktive 3D-Web-Ausstellungen im Browser.

## Stack
- Next.js 15 (App Router), TypeScript strict, React 19
- React Three Fiber v9 RC + @react-three/drei@rc
- Zustand, Firebase (Firestore + Auth + Storage)
- TailwindCSS + Shadcn/UI, Zod

## Rules
- Run `npm run build` after modifying TypeScript files
- Lies immer `src/types/schema.ts` bevor du Code schreibst
- Aendere `src/types/schema.ts` niemals ohne explizite Erlaubnis
- TypeScript strict: kein `any`
- Nutze `@react-three/drei` statt roher Three.js-Mathe
- In `useFrame`: nur `useStore.getState()`, nie `setState`
- Alle 3D-Komponenten: `'use client'`
- Server Components by default; `'use client'` nur wo noetig
- Firebase Client SDK nur in `'use client'` Komponenten
- Firebase Admin SDK nur in Server Actions / API Routes / server-side auth checks
- Auth im App Router ueber Session-Cookies (SSR-freundlich), nicht nur Client-Auth
- Multi-Tenancy ueber Custom Claims (`tenantId`) erzwingen
- Aufgaben immer als Checkbox-Liste fuehren (`- [ ]` / `- [x]`) und aktiv pflegen
- Keine Faulheit, kein Handholding: Aufgaben end-to-end selbst uebernehmen
- Fehler immer selbst fixen; wenn blockiert, sauber stoppen statt riskant zu patchen
- Wenn nicht loesbar, klar als eigenes Scheitern mit Grund und sicherem Status melden
- Commit-Format: `feat|fix|chore: kurze beschreibung`

## Senior Architektur-Regeln (Strikt)
- Next.js Middleware ist Edge-Runtime: `firebase-admin` niemals in `middleware.ts` nutzen.
- Middleware darf nur auf Session-Cookie-Existenz pruefen (`request.cookies.has('session')`).
- Fuer Cookie-Handling `next-firebase-auth-edge` nutzen ODER echte Token-Verifikation in Server-Component Layouts/Server-Code machen.
- Nach Setzen von Custom Claims via Admin SDK muss der Client immer `await user.getIdToken(true)` ausfuehren, bevor Firestore-Zugriffe starten.
- Multi-Tenancy als Membership-Modell: `tenantId` ist eine separate ID (UUID), niemals `uid` des Users.
- Schema und Datenmodell so halten, dass mehrere User denselben Tenant teilen koennen (Team-Accounts).
- Storage-Sicherheit B2B-first: keine pauschalen public-reads fuer 3D-Modelle.
- Beim Upload Custom Metadata setzen (z.B. `isPublished: "false"`).
- Unauthentifizierte Storage-Reads nur fuer explizit publizierte Assets; sonst nur fuer authentifizierte User des passenden Tenants.

## Dateistruktur
- `src/types/schema.ts` -> NICHT aendern
- `src/lib/firebase.ts` -> Client-Side Firebase Init
- `src/lib/firebaseAdmin.ts` -> Server-Side Firebase Admin
- `src/components/3d/` -> R3F Komponenten
- `src/components/ui/` -> Tailwind/Shadcn UI
- `src/store/` -> Zustand Stores
- `src/app/(dashboard)/` -> Admin Dashboard
- `src/app/embed/[id]/` -> Embeddable Viewer
