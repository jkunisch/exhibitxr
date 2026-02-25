# 💳 Comet Browser Agent - Stripe Configuration Setup

Diese Datei enthält den perfekten, ausführbaren Prompt für deinen Browser-Agenten (z.B. Comet), um das gesamte Stripe-Billing-Setup für **3D-Snap / ExhibitXR** fehlerfrei und ohne dein Zutun einzurichten.

---

## 🚀 Der Prompt für den Browser-Agenten

**Kopiere den gesamten folgenden Block und füge ihn bei deinem Browser-Agenten ein:**

```text
Du bist mein Billing-Architekt. Gehe zu https://dashboard.stripe.com/ und logge dich ein (falls nötig, warte auf meine Bestätigung oder 2FA-Eingabe). 
Wir müssen das Subscription-Modell für eine B2B SaaS App (3D-Snap) aufsetzen.

Führe nacheinander exakt diese Schritte aus:

### 1. Produkte anlegen (Product Catalog)
Gehe zu "Produktkatalog" (Products) und erstelle die folgenden ZWEI Abo-Produkte:

**Produkt A: "3D-Snap Starter"**
- **Beschreibung:** "Bis zu 3 Ausstellungen/Modelle, 5.000 Views/Monat, 500MB Storage."
- **Preismodell:** Wiederkehrend (Recurring)
- **Abrechnungsintervall:** Monatlich
- **Preis:** 29,00 EUR

**Produkt B: "3D-Snap Pro"**
- **Beschreibung:** "Bis zu 10 Ausstellungen/Modelle, 50.000 Views/Monat, 5GB Storage, Premium Support."
- **Preismodell:** Wiederkehrend (Recurring)
- **Abrechnungsintervall:** Monatlich
- **Preis:** 99,00 EUR

### 2. Price IDs kopieren
Sobald beide Produkte erstellt sind, navigiere in die Produktdetails beider Pläne und kopiere dir die jeweilige "API ID" für den Preis (diese ID beginnt immer mit "price_..."). Speichere dir diese IDs temporär.

### 3. API Keys besorgen (Developers Section)
- Navigiere oben rechts (oder in der Sidebar) zu "Entwickler" (Developers) -> "API Keys" (API-Schlüssel).
- Kopiere den "Secret key" (Geheimschlüssel). Er beginnt mit "sk_test_" oder "sk_live_".

### 4. Webhook einrichten (Developers -> Webhooks)
- Klicke unter "Entwickler" auf "Webhooks" und füge einen neuen Endpunkt (Endpoint) hinzu.
- **Endpoint URL:** "https://3dsnap.de/api/webhooks/stripe" (oder frage mich nach der genauen Produktions-URL, falls abweichend).
- **Events to send:** Wähle die folgenden drei Events aus:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`
- Klicke auf "Add endpoint".
- Klicke nach dem Erstellen beim Webhook auf "Reveal signing secret" und kopiere dieses Secret. Es beginnt mit "whsec_...".

### 5. Das finale Ergebnis
Gib mir am Ende deiner Ausführung in unserer Unterhaltung AUSSCHLIESSLICH den folgenden .env.local Code-Block zurück, den ich 1:1 in meine App kopieren kann. Fülle die Platzhalter mit den echten Werten, die du gerade generiert und kopiert hast:

STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
```