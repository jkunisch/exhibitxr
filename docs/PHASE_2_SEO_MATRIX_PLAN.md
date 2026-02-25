# 🚀 SEO Phase 2: The Data Matrix (Scaling the PSEO Engine)

## 📍 Kontext & Ziel
Die technische Infrastruktur für unsere Programmatic SEO (pSEO) Maschine steht (`src/app/3d-snap/[industry]/[category]/page.tsx`). Sie ist blitzschnell (SSG) und injiziert korrektes Schema.org Markup.

**Das Problem:** Aktuell haben nur wenige Prototyp-Kategorien (wie "Sofas", "Sneaker", "Armbanduhren") echten, wertvollen Content (Foto-Guidelines, ROI-Rechnungen, FAQs). Alle anderen Kategorien in `src/data/industries.ts` sind "dünn".
**Das Risiko:** Google straft "Thin Content" (Seiten ohne echten Mehrwert) massiv ab. Wir dürfen diese Seiten nicht ohne tiefgreifenden Inhalt indexieren lassen.
**Das Ziel:** Jede Unterkategorie muss zu 100% mit spezifischen, branchenrelevanten Daten gefüllt werden, um als "Most helpful page on the web" zu ranken.

---

## 🛠️ Ausführungsplan (Schritt für Schritt)

### Schritt 1: Die Content-Generierung automatisieren (LLM Prompting)
Es wäre Wahnsinn, die Tipps, FAQs und ROI-Kalkulationen für dutzende Kategorien händisch zu schreiben. Wir nutzen ein starkes LLM (Claude 3.5 Sonnet oder GPT-4o), um die `src/data/industries.ts` Datei strukturiert aufzufüllen.

**Aktion:** Füttere ein LLM mit folgendem System-Prompt und der aktuellen `industries.ts` Datei:

> **System Prompt für Content-Generierung:**
> "Du bist ein B2B SEO-Experte und 3D-Technical Artist. Deine Aufgabe ist es, die fehlenden Datenstrukturen in unserer TypeScript-Datei `industries.ts` aufzufüllen.
> Für JEDE noch leere Kategorie (z.B. Laptops, Vasen, Werkzeuge) benötige ich vier exakte Dinge:
> 1. `snap_tips`: 2-3 konkrete Tipps, wie man ein Produkt dieser Kategorie für Photogrammetrie/KI-3D optimal fotografiert (z.B. bei Glas -> polarisiertes Licht nutzen, bei Elektronik -> Bildschirme abdunkeln).
> 2. `quality_targets`: Realistische Zielwerte für E-Commerce (fileSize: immer unter 3MB, polycount: zwischen 10.000 und 40.000).
> 3. `roi_defaults`: Ein B2B-Kostenvergleich. `agencyTime` (z.B. 2-4 Wochen), `agencyCost` (z.B. 600€ - 1.500€), `snapTime` (immer unter 2 Minuten).
> 4. `faq`: 2 spezifische Fragen und Antworten, die ein E-Commerce-Manager zu dieser Produktkategorie im Kontext von 3D-Generierung haben könnte.
> Liefere mir AUSSCHLIESSLICH den gültigen TypeScript-Code für die aktualisierten Kategorien zurück."

### Schritt 2: Code Review & Integration
- Übernimm den generierten Code in die `src/data/industries.ts`.
- **WICHTIG:** Führe sofort `npx tsc --noEmit` aus, um sicherzustellen, dass das LLM die TypeScript-Interfaces (`CategoryConfig`) nicht gebrochen hat.

### Schritt 3: Die Sitemaps scharfschalten
- Sobald die Matrix zu 100% gefüllt ist, prüfen wir die lokale `/sitemap.xml`.
- Wir reichen die Sitemap in der **Google Search Console** ein (siehe `prompts/comet_agent_setup_prompts.md`).
- **Ping-Mechanismus:** Wir können Google manuell anpingen, die neuen pSEO-Seiten sofort zu crawlen.

### Schritt 4: Indexierungs-Überwachung (Woche 1-2)
- Nach dem Go-Live müssen wir die Google Search Console täglich auf Crawl-Anomalien prüfen:
  - Werden Seiten wegen "Crawlanomalie" oder "Duplikat" abgelehnt?
  - Wenn ja: Müssen wir den Content der betroffenen Kategorien weiter diversifizieren (z.B. branchenspezifischere H1-Tags).

---

## ⚡ Nächste direkte Aktion:
Sobald Claude den Code aus dem isolierten Verzeichnis (Landingpages & Tools) sicher gemergt hat, sollten wir den obigen LLM-Prompt nutzen, um die `industries.ts` final aufzublasen. Danach sind wir SEO-seitig zu 100% "Ready for Launch".
