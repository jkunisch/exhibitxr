# Phase 2 Prompt - Gemini CLI

Aufgabe: Phase 2A/2B/2C - Firebase Security + SSR Auth Backbone

Lies zuerst:
- `GEMINI.md`
- `AGENTS.md`
- `docs/PHASE_2_EXECUTION_PLAN.md`
- `src/types/schema.ts`

Strikte Regeln:
- Checkbox-Tasks aktiv fuehren (`- [ ]`, `- [x]`).
- Kein `firebase-admin` in `middleware.ts`.
- Nach Claim-Set muss Client `await user.getIdToken(true)` nutzen.
- `tenantId` ist UUID einer Organisation, nicht User-UID.

Checkliste:
- [ ] `firebase/firestore.rules` auf Membership-Modell anpassen:
  - Tenant-Daten unter `/tenants/{tenantId}/...`
  - Membership z.B. `/tenants/{tenantId}/members/{uid}` absichern
  - Exhibitions optional public read nur wenn `isPublished == true`
- [ ] `firebase/storage.rules` anpassen:
  - Upload/Write nur fuer Tenant-Member
  - Unauth read nur wenn Objekt-Metadata `isPublished == "true"` (oder klar dokumentierte Alternative)
  - Default deny fuer alles andere
- [ ] `src/app/actions/auth.ts` erstellen:
  - Signup/Register Flow: Tenant (UUID) erzeugen, User an Tenant koppeln
  - Custom Claim `{ tenantId, role }` setzen
  - Session Cookie erstellen (httpOnly, secure, sameSite)
  - Signout Action (Cookie loeschen)
- [ ] Dokumentiere an passender Stelle:
  - Client muss nach Claim-Set `await user.getIdToken(true)` ausfuehren
- [ ] Validierung:
  - kurze Testanleitung fuer Rules + Auth-Flow in Kommentar/Doc

Ergebnisformat:
- Erledigte Checkboxen
- geaenderte Dateien
- offene Risiken
