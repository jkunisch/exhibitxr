# ExhibitXR - Decisions Log

| Datum | Entscheidung | Begruendung |
|-------|--------------|-------------|
| 2026-02-23 | Projektstruktur mit agent-spezifischen Regeln initialisiert | Schnellere, konsistente Multi-Agent Umsetzung |
| 2026-02-23 | `schema.ts` als Single Source of Truth festgelegt | Typ-Sicherheit und stabile Schnittstellen |
| 2026-02-23 | Cloudflare R2 entfernt, 100% Firebase Storage als Asset-Layer gesetzt | Einheitliches Sicherheitsmodell ueber Firebase Rules |
| 2026-02-23 | Dashboard-Auth auf Session-Cookie (SSR) + Middleware-Gate ausgerichtet | Kein Auth-Flackern und klarere Server-Grenzen |
| 2026-02-23 | Multi-Tenancy standardisiert ueber Custom Claims (`tenantId`) | Konsistente und robuste Tenant-Isolation |
| 2026-02-23 | Agent-Disziplin-Regeln erweitert: Checkbox-Tasks, End-to-End Ownership, sichere Fehlerkommunikation | Hohe Ausfuehrungsqualitaet bei Multi-Agent-Parallelarbeit |
| 2026-02-23 | Phase 4B/4C Prompts von R2 auf Firebase Storage migriert | R2 entfernt, upload.ts wird durch lib/storage.ts ersetzt, AWS SDK deinstalliert, konsistente Security Rules |
| 2026-02-23 | Phase 5 geplant: Stripe Billing (5A) + Analytics/View-Limits (5B) | Monetarisierung als naechster Meilenstein, Plan-Guards vor Exhibition-Erstellung |
