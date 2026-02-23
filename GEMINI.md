# ExhibitXR - Gemini CLI Instructions

## Projekt
ExhibitXR: B2B SaaS fuer 3D-Web-Ausstellungen im Browser.

## Stack
Next.js 15 (App Router), TypeScript strict, React 19, R3F v9 RC,
Zustand, Firebase (Firestore + Auth + Storage),
Tailwind, Shadcn/UI, Zod.

## Regeln
- `src/types/schema.ts` ist die Single Source of Truth - NICHT aendern
- TypeScript strict, kein `any`
- Firestore: Tenant-Daten immer unter `/tenants/{tenantId}/`
- Security Rules: `request.auth.token.tenantId == tenantId`
- Server Actions statt API Routes wo moeglich
- Auth fuer Dashboard SSR-sicher mit Session-Cookies aufbauen
- Aufgaben immer mit Checkboxen (`- [ ]` / `- [x]`) planen und abarbeiten
- Keine halbfertigen Loesungen; Fehler eigenstaendig beheben
- Kein riskantes Trial-and-Error: wenn blockiert, klar stoppen und Scheitern benennen
- Bei Unsicherheit: nachfragen

## Senior Architektur-Regeln (Strikt)
- Edge-Safe Middleware: `firebase-admin` niemals in `middleware.ts` einsetzen.
- Middleware nur fuer schnellen Cookie-Gate (`request.cookies.has('session')`), keine Admin-Verifikation im Edge-Context.
- `next-firebase-auth-edge` fuer Session-Cookie-Handling nutzen ODER volle Verifikation serverseitig in Layouts/Actions erledigen.
- Nach dem Setzen von Custom Claims immer Client-Refresh mit `await user.getIdToken(true)` erzwingen, bevor Firestore genutzt wird.
- Tenant-Modell als Organisation: `tenantId` ist eigene UUID und nicht die User-`uid`.
- Membership-faehiges Design: mehrere User duerfen denselben `tenantId` Claim teilen.
- Storage standardmaessig tenant-protected; keine globalen public-reads fuer Modelle.
- Uploads mit Custom Metadata (mindestens `isPublished`) schreiben und Reads fuer unauthentifizierte Nutzer nur bei explizit publizierten Assets erlauben.

## Kernaufgaben
- Firestore Collections + Security Rules
- Firebase Storage Upload-Logik + `storage.rules`
- Session-Cookie Flow + Custom Claims (`tenantId`) via Admin SDK
- Cloud Functions / Webhooks (Stripe, Analytics) falls benoetigt
- Performance-Optimierung, Deployment
