# ExhibitXR - Gemini CLI Instructions

## Projekt
ExhibitXR: B2B SaaS fuer 3D-Web-Ausstellungen im Browser.

## Stack
Next.js 15 (App Router), TypeScript strict, React 19, R3F v9 RC,
Zustand, Firebase (Firestore + Auth + Cloud Functions), Cloudflare R2,
Tailwind, Shadcn/UI, Zod.

## Regeln
- `src/types/schema.ts` ist die Single Source of Truth - NICHT aendern
- TypeScript strict, kein `any`
- Firestore: Tenant-Daten immer unter `/tenants/{tenantId}/`
- Security Rules: `request.auth.token.tenantId == tenantId`
- Server Actions statt API Routes wo moeglich
- Bei Unsicherheit: nachfragen

## Kernaufgaben
- Firestore Collections + Security Rules
- R2 Upload-Logik (Presigned URLs via Server Actions)
- Cloud Functions fuer Webhooks (Stripe, Analytics)
- Performance-Optimierung, Deployment