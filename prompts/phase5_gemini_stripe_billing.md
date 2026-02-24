# Phase 5A – Gemini CLI
# Stripe Billing + Webhook

Lies zuerst:
- `GEMINI.md`
- `src/types/schema.ts` (Tenant hat `plan` Feld)
- `src/lib/firebaseAdmin.ts`
- `src/lib/session.ts`
- `firebase/firestore.rules`
- `docs/ARCHITECTURE.md`

Strikte Regeln:
- Server Actions fuer Checkout Session erstellen
- Webhook als API Route (nicht Server Action – Stripe braucht raw body)
- Stripe Secret Key nur serverseitig
- TypeScript strict, kein `any`

Voraussetzung: Stripe-Account mit Produkten/Preisen angelegt.
Env-Variablen: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

Checkliste:

- [ ] Stripe SDK installieren:
  ```
  npm install stripe
  ```

- [ ] Env-Variablen in `.env.example` ergaenzen:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

- [ ] Stripe Server-Utility erstellen (`src/lib/stripe.ts`):
  - Importiere `Stripe` von `stripe`
  - Exportiere Singleton-Instanz mit `STRIPE_SECRET_KEY`
  - TypeScript-typisiert

- [ ] Checkout Server Action erstellen (`src/app/actions/billing.ts`):
  - `createCheckoutSession(planId: "starter" | "pro")`: Promise<{ url: string }>
  - Session verifizieren (getSessionUser)
  - Stripe Checkout Session erstellen mit:
    - `customer_email`: aus Session
    - `metadata`: `{ tenantId, uid }`
    - `success_url`: `/dashboard?upgraded=true`
    - `cancel_url`: `/dashboard/billing`
    - `mode`: "subscription"
  - Preis-IDs aus env oder hardcoded Mapping

- [ ] Stripe Webhook Route erstellen (`src/app/api/webhooks/stripe/route.ts`):
  - POST Handler
  - Raw Body lesen (kein JSON parse)
  - Stripe Signatur verifizieren mit `STRIPE_WEBHOOK_SECRET`
  - Events behandeln:
    - `checkout.session.completed` → Tenant `plan` in Firestore updaten
    - `customer.subscription.deleted` → Tenant `plan` auf "free" zuruecksetzen
  - Fehler loggen, 200 zurueckgeben (Stripe erwartet das)

- [ ] Billing-Seite erstellen (`src/app/(dashboard)/dashboard/billing/page.tsx`):
  - Aktuellen Plan anzeigen (aus Firestore Tenant-Doc)
  - Pricing-Tabelle: Free / Starter (29€) / Pro (99€)
  - "Upgrade" Buttons → rufen `createCheckoutSession()` auf
  - Redirect zu Stripe Checkout

- [ ] Plan-Guards: Utility-Funktion (`src/lib/planLimits.ts`):
  - Exportiere Limits pro Plan:
    ```
    { free: { exhibitions: 1, storageMb: 50, viewsPerMonth: 500 },
      starter: { exhibitions: 3, storageMb: 500, viewsPerMonth: 5000 },
      pro: { exhibitions: 10, storageMb: 5000, viewsPerMonth: 50000 } }
    ```
  - Exportiere `canCreateExhibition(plan, currentCount): boolean`
  - Dashboard nutzt diese Funktion bei Exhibition-Erstellung

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Installierte Packages
- Offene Risiken (z.B. Webhook Deployment, Stripe Test-Mode)
