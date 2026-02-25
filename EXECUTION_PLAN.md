# ExhibitXR Execution Plan v2

> **Ziel:** In 8 Wochen von Tech-MVP zu verkaufbarem Produkt mit planbarer Kundengewinnung.
> **Strategie:** 6 parallele Agent-Workstreams, Fokus Möbel D2C, Hybrid Concierge GTM, 0–300 €/Monat Budget.

## Erfolgsziele (bis Ende Woche 8)

- ≥ 10 qualifizierte Demos gebucht
- ≥ 3 zahlende Kunden (Starter/Pro)
- Time-to-Value: Signup → veröffentlichter Embed < 15 Minuten
- Embed-Metriken live: Views, CTR, Lead-Captures
- Billing + Plan-Gates + Watermark produktiv

---

## Parallel Safety Model

| Regel | Details |
|-------|---------|
| **Code Ownership** | Jeder Workstream besitzt eigene Dateien, kein Overlap |
| **Contracts first** | A1 veröffentlicht Entitlement-Contract vor A2 |
| **Merge Gate** | `tsc --noEmit` + `npm run build` + 1 Smoke-Flow |
| **Daily Integration** | 1× tägliches Merge-Fenster, kein On-the-fly merge |

### File Ownership

```
A1: src/lib/plans.ts, src/app/actions/billing.ts, src/app/api/stripe/webhook/
A2: src/app/embed/, src/components/3d/Embed*, src/components/3d/Poster*
A3: src/lib/analytics.ts, src/app/api/track/
A4: src/components/ui/Onboarding*, src/app/dashboard/onboarding/
A5: Kein Code — Outbound, Content, Notion CRM
A6: src/lib/glbOptimizer.ts, Logging, OrbitControls-Limits
```

---

## Workstream A1 — Revenue Foundation (P0)

**Owner:** Agent A1 · **Start:** Woche 1

### Scope
1. Stripe Checkout + Customer Portal + Webhook
2. Tenant Billing State: `tenants/{tenantId}.billing`
3. Entitlements serverseitig (branding, credits, exhibition limits)
4. Trial: **14 Tage** (nicht 7)

### Pricing

| Plan | Preis | Modelle | Credits/Mo | Watermark | White-Label |
|------|-------|---------|------------|-----------|-------------|
| Trial | 0 € (14d) | 3 | 3 | Ja (fest) | Nein |
| Starter | 49 €/Mo | 15 | 10 | Optional aus | Nein |
| Pro | 149 €/Mo | 50 | 30 | Nein | Ja + Custom Farbe |
| Agency | 349 €/Mo | Unlimited | 100 | Nein | Ja + Custom Domain |

### Interfaces
```ts
createCheckoutSession(planId: PlanId): Promise<{ url: string }>
openCustomerPortal(): Promise<{ url: string }>
assertEntitlement(tenantId: string, feature: string): Promise<{ allowed: boolean; reason?: string }>
```

### Acceptance
- [ ] Webhook setzt Planstatus korrekt
- [ ] Planwechsel wirkt sofort auf Gates
- [ ] Credits-Gate blockt bei Limit
- [ ] Trial endet nach 14 Tagen automatisch

---

## Workstream A2 — Embed Conversion Engine (P0)

**Owner:** Agent A2 · **Start:** Woche 1 vorbereiten, Woche 2 final nach A1 Contract

### Scope
1. Embed-Parametervertrag final:
   - `autoRotate=1|0`, `hideUI=1|0`, `bg=<hex>`, `branding=0|1`, `cta=1|0`
2. CTA-Modul im Embed (optionaler "Jetzt anfragen"-Button)
3. CWV-Hardening (Poster-first + lazy mount) ← bereits in Arbeit
4. Embed-Code Copy Button im Dashboard

### Dependency
- A1 Entitlement für `branding=0` verpflichtend

### Acceptance
- [ ] Jeder Parameter hat sichtbare Wirkung
- [ ] Ungültige `branding=0` wird serverseitig neutralisiert
- [ ] Embed performant auf Mobile + Desktop (LCP/INP grün)

---

## Workstream A3 — Analytics Minimal (P1-lite)

**Owner:** Agent A3 · **Start:** Woche 3 (2–3 Tage Scope)

### Scope (reduziert — nur 3 Events)
- `embed_viewed`
- `cta_clicked`
- `lead_submitted`

### Storage
Direkt am Exhibition-Dokument via `FieldValue.increment(1)`:
```
metrics.views
metrics.ctaClicks
metrics.leads
```

### Nicht in Phase 1
- ~~UTM-Attribution~~
- ~~Funnel-Reports~~
- ~~Tägliche Aggregationstabellen~~

### Acceptance
- [ ] Counter erhöhen sich korrekt (kein Double-Count)
- [ ] Dashboard zeigt echte Werte statt Placeholder

---

## Workstream A4 — Onboarding to First Win (P0)

**Owner:** Agent A4 · **Start:** Woche 1–2

### Scope
1. Fake-Progress entfernen → echter Generierungsflow
2. First-Win Checklist: Modell → Publish → Embed Copy → Live-Test
3. Concierge-Mode Button ("Wir richten es für dich ein")
4. **NEU:** Nach Embed Copy → Inline-iFrame Live-Preview

### Acceptance
- [ ] Onboarding endet nicht in Simulation
- [ ] User sieht funktionierendes Ergebnis ohne Kontextwechsel
- [ ] Time-to-Value < 15 Minuten im Testlauf

---

## Workstream A5 — Acquisition Engine (P0, sofort)

**Owner:** Agent A5 · **Start:** Woche 1 (keine Code-Dependency!)

### Scope
1. **Founder-led Outbound** — 10 personalisierte Targets/Tag
   - Je Target: Mini-Demo aus echtem Produktfoto + personalisierte DM
2. **CRM (Notion):** `Target | LinkedIn | Status | Demo-Link | Next Step | Objection`
3. **Social Proof Sprint** — 5 Showcase-Demos aus realen Zielkundenprodukten
4. **Vertikale LPs** ab Woche 3–4 (nach ersten Showcases)

### Acceptance
- [ ] Wöchentlich messbar: Kontakte, Antworten, Demo-Calls

---

## Workstream A6 — Reliability + Quality (P1)

**Owner:** Agent A6 · **Start:** Woche 2+

### Scope
1. Strukturierte Logs (Generation/Finalize/Embed errors)
2. Klarere Failure-UX (verständliche Fehlertexte, Retries)
3. **Angle-Limiter Quick-Win** — 180° OrbitControls für Wandprodukte (Woche 2)

### Acceptance
- [ ] Weniger "mystery failures"
- [ ] Angle-Limiter liefert bessere Modellwahrnehmung bei Wandobjekten

---

## Added Items (aus Deep-Think)

| Item | Woche | Aufwand | Nutzen |
|------|-------|---------|--------|
| USDZ Export (Apple AR) | 5–6 | 2–3 Tage | Deal-Closer in Demos |
| "Make it Perfect" Upsell (49 €) | 4 | 1 Tag | Cashcow + Qualitätssicherung |
| Material-Overwrite (Stoff-Textur) | 6+ | 1–2 Tage | Nice-to-have |

---

## 8-Wochen Timeline

```
Woche 1  ▸ A1 Start (Stripe + Entitlements)
         ▸ A4 Start (Onboarding real)
         ▸ A5 Start (Outbound sofort, täglich 10 Targets)
         ▸ A6 Angle-Limiter vorbereiten

Woche 2  ▸ A1 Gates abschließen (Credits, 14d Trial)
         ▸ A2 Finalisierung gegen A1 Contract
         ▸ A4 live inkl. Inline-Preview
         ▸ A6 Angle-Limiter live

Woche 3  ▸ A3 Minimal Analytics (3 Events + Counter)
         ▸ A5 weiter täglich
         ▸ Erste Showcase-Cases strukturieren

Woche 4  ▸ "Make it Perfect" Upsell live
         ▸ LP-Struktur für Möbel-Vertikalen finalisieren

Woche 5  ▸ USDZ Export
         ▸ Embed CTA/Lead-UX optimieren

Woche 6  ▸ USDZ polishing
         ▸ Conversion-Optimierung nach echten Daten

Woche 7  ▸ Stabilisierung, Pricing fine-tuning
         ▸ Security/Cost Guards

Woche 8  ▸ Conversion polish
         ▸ Fokus Abschlussquote aus laufenden Demos
         ▸ ZIEL: ≥ 3 zahlende Kunden
```

---

## Bereits erledigt ✅

| Item | Agent |
|------|-------|
| Inngest Background Jobs | Codex |
| Image Format Conversion (AVIF, HEIC, BMP, TIFF, GIF, SVG → PNG) | Gemini |
| Multi-Key Meshy Fallback (2 API Keys, auto-rotate on 402/429) | Gemini |
| Cloudflare R2 Migration | Codex |
| Lazy Loading Poster Image | Gemini CLI (in Arbeit) |

---

## Assumptions

- **ICP:** Möbel D2C (DACH)
- **GTM:** Hybrid (Produkt + Concierge)
- **Budget:** 0–300 €/Monat
- **Kapazität:** 20–40h/Woche + parallele Agenten
- **Shopify-App:** Out-of-scope bis nach ersten zahlenden Kunden
- **Primärkanal:** Personalisierte Outbound-Demos + vertikale LPs
