# Phase 2.5 Prompt - Gemini CLI

Aufgabe: Security Hardening fuer Rules + Auth-Flow

Lies zuerst:
- `GEMINI.md`
- `docs/PHASE_2_EXECUTION_PLAN.md`
- `firebase/firestore.rules`
- `firebase/storage.rules`
- `src/app/actions/auth.ts`

Strikte Regeln:
- Checkbox-Tasks aktiv fuehren (`- [ ]`, `- [x]`).
- Keine unsicheren Relaxierungen in Rules.
- Alles tenant-first und fail-closed.

Checkliste:
- [x] Firestore Rules hardenen:
  - Member-Write nur Owner/Admin (keine Self-Role-Eskalation)
  - Tenant-Doc write nur Owner/Admin
  - `exhibitions` read public nur bei `isPublished == true`
- [x] Storage Rules hardenen:
  - write nur Tenant-Member
  - unauth read nur bei `resource.metadata.isPublished == "true"`
  - Pfadgrenzen fuer `/tenants/{tenantId}/models/**`
- [x] Auth Action hardenen:
  - Input Validation (companyName, idToken)
  - bessere Fehlercodes fuer UI (z. B. `TENANT_CLAIM_MISSING`)
  - Claim-Set und Session-Handoff klar dokumentieren
- [x] Testbarkeit verbessern:
  - `docs/SECURITY_BASELINE.md` um konkrete Prüfpunkte erweitern
  - kurze Rule-Testmatrix in `docs/` erstellen
- [x] Validation:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Offene Risiken
