# Prompt Files (Temporaer)

Diese Prompts sind temporaer je Phase gedacht und koennen nach Abschluss geloescht werden.

## Reihenfolge

### Phase 1 – Skelett (✅ DONE)
1. `prompts/phase1_claude_ide.md`
2. `prompts/phase1_codex_ide.md`

### Phase 2 – Firebase Backend + Dashboard (✅ DONE)
3. `prompts/phase2_gemini_cli.md`
4. `prompts/phase2_codex_ide.md`
5. `prompts/phase2_4_codex_crud.md`
6. `prompts/phase2_5_gemini_hardening.md`

### Phase 3 – Realtime Editor (✅ DONE)
7. `prompts/phase3_claude_realtime_editor.md`

### Phase 4 – Fixes + Features (IN PROGRESS)
8. `prompts/phase4_claude_3d_fixes.md` → ✅ HotspotMarker, PerformanceMonitor, VAR__
9. `prompts/phase4_gemini_firebase_upload.md` → Firebase Storage Upload + R2 Cleanup
10. `prompts/phase4_codex_dashboard_upload.md` → GLB-Upload UI + Editor-Links
11. `prompts/phase4_claude_ki_chat.md` → ✅ KI Text-Chat Widget

### Phase 5 – SaaS Monetarisierung (NEXT)
12. `prompts/phase5_gemini_stripe_billing.md` → Stripe Checkout + Webhook + Billing Page
13. `prompts/phase5_claude_analytics_viewlimits.md` → View-Counter + Analytics + Plan-Enforcement

### Deprecated
- ~~`prompts/phase4_gemini_r2_upload.md`~~ → Ersetzt durch `phase4_gemini_firebase_upload.md`

## Abhaengigkeiten
- 4C (Codex Dashboard Upload) braucht 4B (Gemini Firebase Upload)
- 5B (Claude Analytics) braucht 5A (Gemini Stripe/Plan-Limits)

## Regel
- Aufgaben im Agent-Chat immer als Checkboxen tracken (`- [ ]`, `- [x]`).
- Phase 4B/4C laufen auf Firebase Storage (kein R2, kein AWS SDK).
