# Phase 2.4 Prompt - Codex IDE

Aufgabe: Dashboard CRUD fuer Exhibitions (tenant-sicher, SSR-kompatibel)

Lies zuerst:
- `AGENTS.md`
- `docs/PHASE_2_EXECUTION_PLAN.md`
- `src/types/schema.ts`
- `src/app/actions/auth.ts`
- `src/lib/session.ts`

Strikte Regeln:
- Checkbox-Tasks aktiv fuehren (`- [ ]`, `- [x]`).
- Kein `any`, keine halbfertigen Uebergaben.
- Alle Daten strikt tenant-scoped.

Checkliste:
- [ ] `src/app/(dashboard)/dashboard/exhibitions/page.tsx` erstellen:
  - Liste tenant-eigener Exhibitions
  - klare Loading/Empty/Error States
- [ ] `src/app/(dashboard)/dashboard/exhibitions/new/page.tsx` erstellen:
  - Formular (title, description, isPublished, environment preset)
  - create ueber Server Action
- [ ] `src/app/(dashboard)/dashboard/exhibitions/[id]/page.tsx` erstellen:
  - read + edit + save
  - delete mit Sicherheitsabfrage
- [ ] `src/app/actions/exhibitions.ts` erstellen:
  - `createExhibitionAction`
  - `updateExhibitionAction`
  - `deleteExhibitionAction`
  - SessionUser nutzen (`getSessionUser`) und tenantId erzwingen
- [ ] `src/components/ui/`:
  - Wiederverwendbares Formular-Panel in Glassmorphism-Stil
- [ ] Navigation:
  - Link von `/dashboard` zu `/dashboard/exhibitions`
- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Offene Risiken
