# Target: https://dashboard.stripe.com/

Du bist ein spezialisierter Komet Browser Agent für Stripe-Konfigurationen. Deine Aufgabe ist es, das Pricing-Modell von "3D-SNAP" (ehemals ExhibitXR) auf Basis einer neuen Credit-Strategie komplett neu anzulegen. Bitte arbeite diese Schritte sorgfältig ab, ohne abzubrechen.

## Aufgabe 1: Alte Produkte aufräumen
1. Gehe im Stripe Dashboard auf "Product Catalog" (Produkte).
2. Archiviere alle alten "ExhibitXR" oder "3D-SNAP" Abonnements (z.B. die alten "Basic", "Pro" oder "Business" Pläne mit den Limitierungen auf 10 oder 100 Ausstellungen).

## Aufgabe 2: Neue Subscription-Pläne (Recurring) anlegen
Erstelle 3 neue Hauptprodukte für die monatlichen Abonnements. 
- Währung: EUR (€)
- Abrechnungsintervall: Monatlich (Füge danach auch jeweils einen Jährlichen Preis mit ca. 20% Rabatt hinzu).

### Produkt 1: Creator
- **Name:** 3D-SNAP Creator
- **Beschreibung:** 45 Credits / Monat (Reicht für ~15 Premium Snaps), Unlimitierte Projekte, Rollover inklusive.
- **Preis (Monatlich):** 19,00 € / Monat
- **Preis (Jährlich):** 182,00 € / Jahr
- **Metadaten (WICHTIG):** Füge dem Produkt (oder dem Preis) zwingend die Metadaten `plan: starter` und `credits: 45` hinzu.

### Produkt 2: Studio
- **Name:** 3D-SNAP Studio
- **Beschreibung:** 150 Credits / Monat (Reicht für ~50 Premium Snaps), für Shops & Agenturen, Rollover inklusive.
- **Preis (Monatlich):** 49,00 € / Monat
- **Preis (Jährlich):** 470,00 € / Jahr
- **Metadaten (WICHTIG):** Füge als Metadaten `plan: pro` und `credits: 150` hinzu.

### Produkt 3: Business
- **Name:** 3D-SNAP Business
- **Beschreibung:** 500 Credits / Monat, API Zugang, Priorität.
- **Preis (Monatlich):** 149,00 € / Monat
- **Preis (Jährlich):** 1430,00 € / Jahr
- **Metadaten (WICHTIG):** Füge als Metadaten `plan: enterprise` und `credits: 500` hinzu.

## Aufgabe 3: Top-Up Credit Packs (Einmalkauf) anlegen
Erstelle 3 weitere Produkte. Diese sind KEINE Abonnements, sondern Einmalkäufe (One-Time).

1. **10 Credit Pack**
   - Preis: 15,00 € (Einmalig)
   - Metadaten: `type: topup`, `credits: 10`
2. **50 Credit Pack**
   - Preis: 65,00 € (Einmalig)
   - Metadaten: `type: topup`, `credits: 50`
3. **150 Credit Pack**
   - Preis: 179,00 € (Einmalig)
   - Metadaten: `type: topup`, `credits: 150`

## Abschluss
Erstelle für jedes der 3 Abonnements (Creator, Studio, Business) einen "Payment Link" (Zahlungslink) für die monatliche Zahlweise. Kopiere diese 3 Links und präsentiere sie am Ende in einer Übersicht.
