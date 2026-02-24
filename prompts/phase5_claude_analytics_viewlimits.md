# Phase 5B – Claude Opus (Antigravity)
# View-Counter, Analytics, Plan-Enforcement

Lies zuerst:
- `.antigravity/rules`
- `src/types/schema.ts`
- `src/lib/planLimits.ts` (MUSS VORHER VON GEMINI ERSTELLT SEIN – Phase 5A)
- `src/store/editorStore.ts`
- `src/components/3d/EmbedViewer.tsx`
- `src/app/embed/[id]/page.tsx`
- `firebase/firestore.rules`

Strikte Regeln:
- useFrame: nur `getState()`, kein setState
- Analytics-Events lokal sammeln, batch schreiben
- TypeScript strict, kein `any`
- Checkbox-Tasks aktiv fuehren

Abhaengigkeit: Phase 5A (Stripe/Plan-Limits) muss abgeschlossen sein.

Checkliste:

- [ ] View-Counter Server Action (`src/app/actions/analytics.ts`):
  - `recordView(exhibitId: string, tenantId: string)`: void
  - Inkrementiert Firestore Counter: `/tenants/{tenantId}/stats/views`
  - Nutzt `FieldValue.increment(1)`
  - Trackt auch per-Exhibition: `/tenants/{tenantId}/exhibitions/{exhibitId}/stats/views`
  - Taeglich aggregiert: Feld `daily.{YYYY-MM-DD}` als Map

- [ ] View-Limit Enforcement in Embed-Route (`src/app/embed/[id]/page.tsx`):
  - Nach Config laden: View-Count fuer aktuellen Monat lesen
  - Tenant-Plan aus Firestore lesen
  - Wenn viewCount >= planLimit:
    - Rendere Paywall-Overlay statt 3D-Canvas
    - "Dieses Exhibit hat das monatliche View-Limit erreicht. Kontaktieren Sie den Anbieter."
    - KEIN Crash, kein 403 – freundliches Overlay

- [ ] Client-Side Analytics Events (`src/hooks/useAnalytics.ts`):
  - Custom Hook: `useAnalytics(exhibitId: string, tenantId: string)`
  - Trackt Events lokal in einem Ref-Array:
    - `view_start` (beim Mount)
    - `hotspot_click` (hotspotId)
    - `variant_change` (variantId)
    - `chat_message` (count only, kein Inhalt)
  - Alle 10 Sekunden: Batch-Write nach Firestore
    `/tenants/{tenantId}/exhibitions/{exhibitId}/analytics/{sessionId}`
  - Cleanup auf Unmount (flush remaining events)

- [ ] Analytics in EmbedViewer integrieren:
  - `EmbedViewer.tsx` ruft `useAnalytics()` auf
  - Hotspot-Click und Variant-Change Events tracken
  - View-Start automatisch beim Mount

- [ ] Dashboard Analytics-Seite (`src/app/(dashboard)/dashboard/analytics/page.tsx`):
  - Einfache Uebersicht pro Exhibition:
    - Total Views (Monat)
    - Klicks pro Hotspot (Balkendiagramm, einfaches div-basiert)
    - Varianten-Wechsel Count
  - Daten aus Firestore `/tenants/{tenantId}/exhibitions/{exhibitId}/stats/`
  - Kein externes Chart-Library noetig – CSS-Balken reichen

- [ ] Plan-Guard bei Exhibition-Erstellung:
  - In `createExhibitionAction`: vor dem Erstellen pruefen
  - `canCreateExhibition(tenant.plan, currentExhibitionCount)` aufrufen
  - Wenn false: `{ ok: false, error: "Exhibition-Limit erreicht. Bitte upgraden." }`

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Offene Risiken (z.B. Firestore Costs bei hohem Traffic, Rate-Limiting)
