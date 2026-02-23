# Phase 2 Step-by-Step

## 1) Branches vorbereiten
- [ ] `main` aktualisieren
- [ ] Worktrees nutzen:
  - Gemini: `feature/phase2-gemini`
  - Codex: `feature/phase2-codex`

## 2) Gemini zuerst laufen lassen
- [ ] Prompt nutzen: `prompts/phase2_gemini_cli.md`
- [ ] Fokus: `firebase/*.rules`, `src/app/actions/auth.ts`
- [ ] Ergebnis: Commit + Push + PR

## 3) Gemini PR mergen
- [ ] PR reviewen
- [ ] Merge in `main`

## 4) Codex auf neues main rebasen
- [ ] `feature/phase2-codex` auf `origin/main` rebasen
- [ ] Konflikte loesen

## 5) Codex laufen lassen
- [ ] Prompt nutzen: `prompts/phase2_codex_ide.md`
- [ ] Fokus: Login/Dashboard/SSR-safe flow
- [ ] Ergebnis: Commit + Push + PR

## 6) Validierung (ich uebernehme das)
- [ ] `npm install --legacy-peer-deps`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Smoke-Test:
  - `/login`
  - `/dashboard`
  - `/embed/demo`

## 7) Abschluss
- [ ] Codex PR mergen
- [ ] `main` clean syncen
- [ ] Prompt-Dateien dieser Phase optional loeschen
