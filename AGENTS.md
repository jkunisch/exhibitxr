# ExhibitXR - Codex Agent Instructions

## Projekt
ExhibitXR: B2B SaaS fuer interaktive 3D-Web-Ausstellungen im Browser.

## Stack
- Next.js 15 (App Router), TypeScript strict, React 19
- React Three Fiber v9 RC + @react-three/drei@rc
- Zustand, Firebase (Firestore + Auth + Cloud Functions), Cloudflare R2
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
- Firebase Admin SDK nur in Server Actions / API Routes
- Commit-Format: `feat|fix|chore: kurze beschreibung`

## Dateistruktur
- `src/types/schema.ts` -> NICHT aendern
- `src/lib/firebase.ts` -> Client-Side Firebase Init
- `src/lib/firebaseAdmin.ts` -> Server-Side Firebase Admin
- `src/components/3d/` -> R3F Komponenten
- `src/components/ui/` -> Tailwind/Shadcn UI
- `src/store/` -> Zustand Stores
- `src/app/(dashboard)/` -> Admin Dashboard
- `src/app/embed/[id]/` -> Embeddable Viewer