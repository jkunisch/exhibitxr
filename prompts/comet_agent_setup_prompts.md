# Comet Browser Agent - Setup Prompts

Diese Datei enthält vorgefertigte Prompts, die du in deinen Browser-Agenten (z.B. Comet) kopieren kannst, um essenzielle Setup-Aufgaben für **3D-Snap / ExhibitXR** automatisiert im Browser durchführen zu lassen.

---

## 1. 💳 Stripe Pricing & Produkte Setup

**Kontext:** Wir haben in der `StudioCard` auf der Startseite 3 Tarife definiert: Trial (0€), Starter (29€) und Business (99€). Der Agent soll diese in Stripe anlegen.

**Prompt für den Agenten:**
```text
Gehe zu https://dashboard.stripe.com/ und logge dich ein (falls nötig warte auf meine Eingabe).
Navigiere zum Bereich "Produktkatalog" (Product Catalog) und erstelle die folgenden drei Produkte inklusive Preisgestaltung:

1. Produktname: "3D-Snap Starter"
   - Beschreibung: "10 Projects / Month, Analytics, Priority Processing"
   - Preismodell: Wiederkehrend (Recurring)
   - Preis: 29,00 EUR
   - Abrechnungsintervall: Monatlich

2. Produktname: "3D-Snap Business"
   - Beschreibung: "Unlimited Volume, API Infrastructure, Custom Domain"
   - Preismodell: Wiederkehrend (Recurring)
   - Preis: 99,00 EUR
   - Abrechnungsintervall: Monatlich

Sobald die Produkte erstellt sind, navigiere zu jedem Produkt, erstelle jeweils einen Payment Link (Bezahl-Link) und kopiere die generierten URLs für Starter und Business in ein neues Textdokument oder gib sie mir hier im Chat aus.
```

---

## 2. ☁️ Cloudflare DNS & Performance Setup

**Kontext:** Für maximale Geschwindigkeit (GLB-Modelle laden) und Sicherheit (DDoS-Schutz) müssen spezifische Cloudflare-Regeln gesetzt werden.

**Prompt für den Agenten:**
```text
Gehe zu https://dash.cloudflare.com/ und öffne das Dashboard für die Domain "3dsnap.de" (oder die aktuelle Projekt-Domain).
Führe die folgenden Optimierungen durch:

1. Gehe zu "Speed" -> "Optimization" und aktiviere "Brotli" sowie "Early Hints".
2. Gehe zu "Caching" -> "Configuration" und setze das "Browser Cache TTL" auf "1 month" oder "1 year" (da unsere 3D .glb Dateien sich selten ändern).
3. Erstelle eine Cache Rule (unter Caching -> Cache Rules):
   - Name: "Cache 3D Models"
   - URI Path beinhaltet: ".glb" ODER URI Path beinhaltet ".fbx"
   - Aktion: Eligible for cache (Cache Level: Cache Everything)
   - Edge Cache TTL: 1 Monat
4. Gehe zu "SSL/TLS" -> "Overview" und stelle sicher, dass der Modus auf "Full (strict)" steht.

Gib mir Bescheid, sobald alle Einstellungen angewendet wurden.
```

---

## 3. 🔍 Google Search Console & Sitemap Submit

**Kontext:** Um das neu aufgesetzte pSEO-Netzwerk von Google sofort indexieren zu lassen, muss die Sitemap eingereicht werden.

**Prompt für den Agenten:**
```text
Gehe zur Google Search Console (https://search.google.com/search-console).
Wähle das Property für "https://3dsnap.de" aus (oder lege es an, falls es noch nicht existiert - in diesem Fall navigiere mich durch den DNS-Verifizierungs-Prozess).

Sobald das Property geöffnet ist:
1. Navigiere im linken Menü zu "Sitemaps".
2. Trage im Feld "Neue Sitemap hinzufügen" folgenden Pfad ein: "sitemap.xml".
3. Klicke auf "Senden".
4. Warte auf die Bestätigung und prüfe im Anschluss unter "Seiten" -> "Nicht indexiert", ob es offensichtliche Fehler beim Crawling gab, die wir beheben müssen. Teile mir das Ergebnis mit.
```