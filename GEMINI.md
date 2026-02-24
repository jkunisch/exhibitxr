# ExhibitXR - Gemini CLI Instructions

## Projekt
ExhibitXR: B2B SaaS — Firmen laden Produktfotos hoch, Meshy AI generiert
realistische 3D-Modelle, die als interaktive Web-Showrooms eingebettet werden.

## ZUERST LESEN
- `/.context.md` — Vollstaendige Architektur, Status, Regeln
- `/src/types/schema.ts` — Single Source of Truth fuer alle Typen

## Stack
Next.js 16 (App Router), TypeScript strict, React 19, R3F v9 RC,
Zustand 5, Firebase (Firestore + Auth + Storage),
TailwindCSS 4, Framer Motion, Zod.

## Aktuelle Prioritaet
**Kernprodukt: Foto→3D Pipeline**
1. `ModelGeneratorPanel` in `EditorShell` Sidebar einbauen
2. Pipeline live testen (Meshy API Key ist in `.env.local`)
3. GLB-Qualitaet pruefen und Optimizer-Parameter tunen

## Regeln
- `src/types/schema.ts` ist die Single Source of Truth — NICHT aendern
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
- Middleware nur fuer schnellen Cookie-Gate (`request.cookies.has('session')`).
- Nach dem Setzen von Custom Claims immer Client-Refresh mit `await user.getIdToken(true)` erzwingen.
- Tenant-Modell als Organisation: `tenantId` ist eigene UUID, nicht die User-`uid`.
- Membership-faehiges Design: mehrere User duerfen denselben `tenantId` Claim teilen.
- Storage standardmaessig tenant-protected; keine globalen public-reads fuer Modelle.
- Uploads mit Custom Metadata (mindestens `isPublished`) schreiben.

## Verfuegbare APIs
| API | Status | Zweck |
|-----|--------|-------|
| Meshy Pro | ✅ Key in .env.local | Foto → 3D (PBR, GLB) |
| OpenAI | ❌ Key fehlt (spaeter) | KI-Chat im Viewer |
| Firebase | ✅ Konfiguriert | Auth, Firestore, Storage |

## Kernaufgaben (aktuell)
- Foto→3D Pipeline live testen und in Editor integrieren
- GLB Optimizer tunen fuer optimale Qualitaet/Groesse
- Dashboard UX fuer B2B-Kunden verbessern
