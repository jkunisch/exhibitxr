# 🤖 AGENT TASK: The 3D-Snap Outreach Crawler (Sales Waffe)

**Projekt:** ExhibitXR (3D-Snap) - Ein B2B SaaS, das Produktfotos in Sekunden in interaktive 3D-Modelle verwandelt ("Just Snap it").
**Mission:** Schreibe das tödlichste Outbound-Sales-Skript, das je für eine B2B-SaaS gebaut wurde. Kein Spam. Wir schicken E-Commerce-Shops fertige 3D-Modelle ihrer eigenen Bestseller.

---

## 🎯 DEIN ZIEL (Für das LLM, das diesen Prompt ausführt)
Schreibe ein vollständiges, ausführbares TypeScript-Skript (`scripts/outreach-crawler.ts`), das per Kommandozeile aufgerufen wird:
`npx tsx scripts/outreach-crawler.ts <SHOPIFY_ODER_WOOCOMMERCE_URL>`

Das Skript muss **vollautomatisch** diese Pipeline durchlaufen:
1. **Scraping:** Die URL besuchen und das Haupt-Produktbild (z.B. via `<meta property="og:image">`) sowie den Produktnamen (`og:title`) extrahieren.
2. **Download:** Das Bild als Buffer in den Arbeitsspeicher laden.
3. **3D-Generierung (The Magic):** Unsere interne API-Funktion (`submitImageTo3D` und `pollTaskStatus` aus `src/lib/meshy.ts`) aufrufen, um das Bild in ein 3D-Modell (.glb) zu verwandeln.
4. **Datenbank-Eintrag:** Das fertige Modell über `firebase-admin` (aus `src/lib/firebaseAdmin.ts`) als neue, ungelistete "Ausstellung" (Exhibition) in unserer Firestore-Datenbank anlegen. Das generiert einen sharebaren Link: `https://3dsnap.de/embed/<NEUE_ID>`.
5. **Hyper-Personalisiertes Copywriting:** Nutze die **OpenRouter API** (mit dem Modell `minimax/minimax-m2.5` für diesen Testlauf), um eine extrem kurze, aggressive Kaltakquise-Email zu verfassen. Lade den API-Key `OPENROUTER_API_KEY` aus der `.env.local`.

---

## 🏗️ TECHNISCHE SPEZIFIKATIONEN & IMPORTE

### 1. Abhängigkeiten (Nutze vorhandene Projekt-Libs)
- Nutze `cheerio` für das extrem schnelle HTML-Scraping (kein schweres Puppeteer nötig, `og:tags` reichen).
- Nutze `node-fetch` (oder natives `fetch` in Node 18+) für den Bild-Download.
- Importiere Firebase Admin: `import { getAdminDb } from "../src/lib/firebaseAdmin";`
- Importiere Meshy: `import { submitImageTo3D, pollTaskStatus } from "../src/lib/meshy";`
- Nutze natives `fetch` an den OpenRouter Endpoint (`https://openrouter.ai/api/v1/chat/completions`) für den Text-Generator.

### 2. Der Datenbank-Eintrag (Firestore)
Erstelle ein neues Dokument in `tenants/<DEINE_ADMIN_TENANT_ID>/exhibitions/<UUID>`.
Das Objekt muss dem `schema.ts` entsprechen:
```typescript
{
  id: generatedUuid,
  tenantId: "admin-outreach-tenant", // Oder eine konfigurierbare Konstante
  title: `Outreach: ${scrapedProductName}`,
  isPublished: true, // Muss true sein, damit der Link klappt
  glbUrl: meshyResult.glbUrl,
  environment: "studio",
  model: {
    id: crypto.randomUUID(),
    label: scrapedProductName,
    glbUrl: meshyResult.glbUrl,
    scale: 1,
    position: [0, 0, 0],
    variants: [],
    hotspots: []
  },
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
}
```

### 3. Der LLM Prompt (Für die E-Mail-Generierung)
Übergib dem OpenRouter Modell folgenden System-Prompt, um die Mail zu generieren:
> "Du bist der Lead Growth Hacker für 3D-Snap. Schreibe eine Kaltakquise-Email an den Shopbetreiber von [Shop-Name].
> Kontext: Du hast dir sein Bestseller-Produkt '[Produkt-Name]' angesehen. Es hat aktuell kein 3D-Modell, was mobile Conversions kostet.
> Der Pitch: Anstatt ihm etwas zu verkaufen, hast du sein Produktbild genommen und es in 30 Sekunden durch unsere 3D-Snap KI gejagt.
> Call to Action: Er soll sich das fertige, interaktive 3D-Modell seines Produkts hier ansehen: [Embed-Link]. Wenn er sein restliches Inventar auch so mühelos in 3D verwandeln will, soll er antworten.
> Tonfall: Extrem kurz, selbstbewusst, kein Marketing-Bullshit. Maximal 4 Sätze. Zeige, don't tell."

---

## 🚦 ANFORDERUNGEN AN DEINEN CODE (Output)
1. Liefere eine einzige, vollständige TypeScript-Datei.
2. Baue ein sauberes CLI-Feedback mit Farben (nutze `console.log` mit Terminal-Color-Codes oder `ora`/`chalk`, falls du magst, ansonsten simple Emojis: 🔍 Scraping... ⚡ Snapping... 📧 Writing...).
3. Implementiere sauberes Error-Handling (Was, wenn die URL kein `og:image` hat? Was, wenn Meshy fehlschlägt?).
4. Vergiss nicht `.env.local` mit `dotenv` am Anfang des Skripts zu laden, damit Firebase und die API-Keys funktionieren!

Schreibe jetzt den Code für `scripts/outreach-crawler.ts`.