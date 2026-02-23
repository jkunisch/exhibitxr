# Phase 2 Execution Plan (Gemini + Codex)

## Ziel
Robustes Firebase-Backend mit SSR-sicherem Auth-Flow, sauberer Tenant-Isolation und Dashboard-Grundfunktionen.

## Reihenfolge
1. Gemini CLI: Regeln + Auth-Backbone
2. Codex IDE: Login + Dashboard-Flow
3. Gemini CLI: Security Pass + final rule adjustments

## Owner-Matrix
- Gemini CLI:
  - `firebase/firestore.rules`
  - `firebase/storage.rules`
  - `src/app/actions/auth.ts`
  - `src/lib/firebaseAdmin.ts` (falls noetig fuer Session/Claims)
- Codex IDE:
  - `src/app/(dashboard)/*`
  - `src/app/login/*` oder `src/app/(dashboard)/login/*`
  - `src/components/ui/*` (auth/dashboard UI)
  - `middleware.ts` (nur falls cookie gate/matcher angepasst werden muss)

## Nicht verhandelbare Regeln
- `firebase-admin` nie in Edge-Middleware.
- Middleware nur Cookie-Gate (`request.cookies.has('session')`).
- Nach Claim-Set: Client muss `await user.getIdToken(true)` ausfuehren.
- `tenantId` ist Organisations-ID (UUID), nie User-UID.
- Storage default protected; unauth read nur fuer explizit publizierte Assets.

## Phase 2 Checkliste
- [ ] P2-A (Gemini): Firestore rules fuer Tenant + Membership + published exhibits
- [ ] P2-B (Gemini): Storage rules mit `isPublished` Metadata-Gate
- [ ] P2-C (Gemini): Auth actions fuer Signup/Claim/Session-Cookie
- [ ] P2-D (Codex): Login flow + session cookie handoff
- [ ] P2-E (Codex): Dashboard route protection + basic exhibitions page
- [ ] P2-F (Owner): `npm run lint` + `npm run build` gruen

## Abnahme
- [ ] Unauth Zugriff auf Dashboard wird geblockt
- [ ] Auth user mit falschem Tenant sieht keine fremden Daten
- [ ] Published Asset ist lesbar, private Assets bleiben geschuetzt
- [ ] Nach Registrierung funktioniert Claim-basierter Firestore-Zugriff ohne Reload-Bugs
