# Phase 2 Prompt - Codex IDE

Aufgabe: Phase 2D/2E - Login + Dashboard Flow (SSR-safe)

Lies zuerst:
- `AGENTS.md`
- `docs/PHASE_2_EXECUTION_PLAN.md`
- `src/types/schema.ts`
- bestehende Auth/Action-Dateien aus Gemini-Branch

Strikte Regeln:
- Checkbox-Tasks aktiv fuehren.
- Keine halbfertigen Uebergaben.
- Bei Blockade: nichts kaputt machen, klaren Status melden.

Checkliste:
- [ ] Login UI erstellen:
  - `src/app/login/page.tsx` (oder bestehende Login-Route konsolidieren)
  - Firebase Client Login
  - nach Login: Session-Cookie Action aufrufen
  - bei Claim-Neusetzung: `await user.getIdToken(true)` beachten
- [ ] Dashboard Basisschutz:
  - Middleware bleibt reiner Cookie-Gate
  - serverseitige Verifikation in Layout/Server Action integrieren
- [ ] Dashboard Einstieg:
  - einfache `exhibitions` Liste fuer aktuellen Tenant
  - klare Loading/Error States
- [ ] UX:
  - konsistente Glassmorphism-UI
  - mobile + desktop brauchbar
- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- geaenderte Dateien
- offene Risiken
