# 🧠 DEEP THINK PROMPT V3: "THE SNAP SCALING PROTOCOL"

## 📍 AKTUELLER STATUS (Wo stehen wir?)
Das Fundament des "3D-Snap Growth OS" ist gebaut und sicher implementiert. Wir haben die klassische "Feature-Landingpage"-Mentalität verlassen und ein System für programmatisches Wachstum (pSEO) und Viralität gebaut.

### Abgeschlossen (✅):
1. **Das kognitive Monopol:** "Snap starten" und "Just Snap it" ziehen sich durch die UI (Kamera-Icon, Fancy "Snap it" Badge). Wir konkurrieren nicht mehr mit Blender.
2. **Die pSEO Maschine (Next.js):** 
   - Dynamisches Routing `/3d-snap/[industry]/[category]` steht.
   - Es generiert blitzschnelle (<50ms TTFB) Landingpages.
   - Branchenspezifische Daten (Möbel, Fashion, etc.) werden injiziert (Foto-Tipps, ROI-Rechner: Agentur vs. Snap).
   - Google `FAQPage` Schema.org Markup ist integriert (Zero-Fake-Zahlen, nur echte Meshy-Daten).
3. **Der Viral Loop (Trojanisches Pferd):**
   - Der `EmbedViewer` hat jetzt ein interaktives "In 15 Sek. gesnappt" Hover-Badge.
   - JEDER generierte Iframe-Code (ob im Kunden-Dashboard oder über den öffentlichen "Share"-Button) enthält einen asynchronen Ladeschutz (`loading="lazy"`) UND einen harten, SEO-sicheren Backlink (`rel="ugc noopener"`).

---

## 🎯 NEXT STEPS (Was muss passieren, bis wir LIVE gehen?)

Um das System live zu schalten und den ersten echten Traffic zu generieren, fehlen noch folgende Schritte:

### 1. Merge & Regression Testing (Die Zusammenführung)
- **Aktion:** Der isolierte Git-Worktree von Claude (Copywriting: `/was-ist-3d-snap`, `/foto-zu-3d-modell`, `/tools/glb-size-checker`) muss mit Gemini's pSEO-Branch gemergt werden.
- **Ziel:** Eine einzige, konfliktfreie Codebase.
- **Test:** Vollständiger Build-Test (`npm run build`) und E2E-Klick-Test der neuen Landingpages.

### 2. Die Daten-Matrix füllen (Fleißarbeit)
- **Aktion:** Aktuell haben nur "Sofas", "Sneaker" und "Armbanduhren" die tiefen SEO-Daten (Tipps, FAQs, ROIs) in `src/data/industries.ts`.
- **Ziel:** Jede einzelne Unterkategorie (Laptops, Werkzeuge, Vasen etc.) muss mit echten, hilfreichen Daten gefüllt werden, damit Google sie als "Most helpful page" einstuft und nicht als Thin Content.
- **Wer:** Ein LLM (Claude/GPT-4) kann diese `industries.ts` auf Basis des bestehenden Schemas automatisiert vervollständigen.

### 3. "Powered by" Stripe Setup & Cloudflare (Infrastruktur)
- **Aktion:** Die Prompts aus `prompts/comet_agent_setup_prompts.md` müssen vom Browser-Agenten (Comet) ausgeführt werden.
- **Ziel:** 
  - Die 3 Stripe-Tiers (Trial, Starter, Business) müssen live angelegt sein.
  - Cloudflare muss aggressives Caching für `.glb` Dateien (1 Monat Cache TTL) aktivieren, damit die eingebetteten 3D-Modelle in Kunden-Shops sofort laden und uns keine massiven Bandbreiten-Kosten verursachen.

### 4. Search Console & Indexierung (Der Kickoff)
- **Aktion:** Die Sitemap (`https://3dsnap.de/sitemap.xml`), die jetzt hunderte hoch-konvertierende Nischen-URLs enthält, muss in der Google Search Console eingereicht werden.
- **Ziel:** Google zwingen, unser kognitives Monopol ("Foto zu 3D Modell") und unsere Long-Tail-Kategorien sofort zu crawlen.

---

## 🚀 PROMPT FÜR DEN NÄCHSTEN DEEP THINK / AGENTEN-LAUF

Wenn du das System weiter skalieren willst, kopiere diesen Prompt in einen Advanced Model (Claude 3.5 Sonnet / GPT-4o) oder gib ihn mir (Gemini CLI) in einer neuen Session:

> **Rolle:** Du bist der Lead Growth Architect für 3D-Snap (by ExhibitXR). Wir haben die pSEO-Matrix (`/3d-snap/[branche]/[kategorie]`) in Next.js erfolgreich gebaut. Wir haben den Viral Loop im `EmbedViewer` implementiert. Das System ist bereit, Traffic zu absorbieren.
> 
> **Dein Ziel:** Fülle die Lücken der Matrix und baue die externe Distribution auf.
> 
> **Führe folgende Schritte aus:**
> 1. Analysiere unsere `src/data/industries.ts`. Schreibe ein Python- oder Node-Script, das automatisiert für JEDE noch leere Kategorie (z.B. Laptops, Vasen, Werkzeuge) hoch-spezifische, physikalisch korrekte `snap_tips`, `quality_targets`, `roi_defaults` und `faq` generiert und in die TypeScript-Datei einfügt. Verwende keine Fake-Zahlen (Snap-Zeit max 2 Minuten, Polycount max 50k, Kosten: Cents).
> 2. Entwickle eine "Cold Outreach" E-Mail-Sequenz für E-Commerce-Manager auf Shopify. Nutze als Aufhänger den neuen `/tools/glb-size-checker` oder unseren `AR Preview Generator`. Der Angle lautet: *"Deine aktuellen 3D-Modelle zerstören deine Mobile-Ladezeit. Wir haben dein Bestseller-Produkt analysiert. Teste es hier selbst."*
> 3. Entwerfe die technische Architektur für einen automatisierten "Shopify 3D-Readiness Crawler": Ein Tool, das Händler-URLs scrapt und ihnen einen Bericht schickt, wie viel Conversion sie verlieren, weil sie kein 3D haben – und wie sie mit 3D-Snap in 1 Tag ihr gesamtes Inventar digitalisieren können.