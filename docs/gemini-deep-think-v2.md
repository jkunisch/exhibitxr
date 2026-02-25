# ExhibitXR — Gemini Deep Think: Produktidee markttauglich machen

## Anweisung an Gemini

Du bist ein erfahrener SaaS-Produkt-Stratege, CTO und Go-To-Market-Berater. Analysiere das folgende Produkt im Detail. Nutze Deep Think, um systematisch alle Schwächen, Chancen und konkrete Lösungen zu identifizieren, die das Produkt von einem MVP zu einem markttauglichen, umsatzgenerierenden B2B-SaaS machen.

**Dein Output soll enthalten:**
1. Kritische Lücken die vor dem ersten zahlenden Kunden geschlossen werden MÜSSEN
2. Feature-Priorisierung (Impact vs. Aufwand Matrix)
3. Pricing-Strategie für DACH KMUs
4. Konkrete technische Lösungen für jedes identifizierte Problem
5. GTM-Strategie für die ersten 20 zahlenden Kunden
6. Wettbewerbsanalyse: Was macht ExhibitXR besser/schlechter als Alternativen?
7. Monetarisierungs-Roadmap (Monat 1 → Monat 6)

---

## Produkt: ExhibitXR

### Was ist ExhibitXR?
Ein B2B-SaaS das KMUs ermöglicht, aus Produktfotos automatisch interaktive 3D-Showrooms zu erstellen und als iFrame in ihre Website einzubetten. Zielgruppe: Möbelhersteller, Deko, Schmuck, Interior Design im DACH-Raum.

### Kernflow (funktioniert End-to-End)
1. Nutzer loggt sich ein (Firebase Auth)
2. Erstellt eine "Ausstellung" im Dashboard
3. Lädt 1-5 Produktfotos hoch (PNG, JPEG, WebP, AVIF, HEIC, BMP, TIFF — alle Formate automatisch konvertiert)
4. Wählt KI-Engine: ⚡ Tripo (20-30 Sek, schnell) oder 🎨 Meshy (5-20 Min, detaillierter)
5. Multi-Image Upload möglich: 2-4 Fotos aus verschiedenen Winkeln → Tripo Multiview = höhere 3D-Qualität
6. KI generiert GLB-Modell → automatisch optimiert (Draco-Kompression, Polygon-Reduktion)
7. Modell wird in Firebase Storage gespeichert
8. Interaktiver 3D-Viewer mit: OrbitControls, Cinematic Showcase Mode, Exploded View, Hotspots, Chat-Widget
9. Embed via iFrame: `<iframe src="exhibitxr.com/embed/ID">` — eine Zeile Code für die Website

### Tech-Stack
- **Frontend:** Next.js 16 + React 19 + TypeScript
- **3D Rendering:** React Three Fiber (R3F) + Three.js
- **3D Generation:** Tripo3D v2 API + Meshy API (Dual-Provider)
- **Auth:** Firebase Authentication (Email/Google)
- **Database:** Firestore (Multi-Tenant: /tenants/{id}/exhibitions/{id})
- **Storage:** Firebase Storage (GLB + Bilder)
- **Hosting:** Vercel (Frontend), Firebase (Backend Services)

### Was FUNKTIONIERT (Stand heute, 25.02.2026)
- ✅ User Registration + Login
- ✅ Multi-Tenant Dashboard
- ✅ Bild-Upload mit Drag & Drop
- ✅ KI-3D-Generierung (Meshy tested, Tripo integriert)
- ✅ Automatische GLB-Optimierung (40MB → 2-3MB)
- ✅ Firebase Storage mit CORS
- ✅ Interaktiver 3D-Viewer mit Cinematic Mode
- ✅ Embed-Route (/embed/[id])
- ✅ Multi-Image Upload für bessere Qualität
- ✅ Provider-Toggle (Tripo ⚡ / Meshy 🎨)
- ✅ TypeScript strict, zero errors

### Was FEHLT / Probleme
- ❌ Kein Pricing/Checkout (Stripe nicht integriert)
- ❌ Kein "Code kopieren" Button für iFrame-Embed
- ❌ Kein Onboarding/Tutorial für neue Nutzer
- ❌ Tripo API Credits funktionieren nicht (Web-Credits ≠ API-Credits)
- ❌ Keine Analytics (wer bettet ein, wieviele Views)
- ❌ Keine Custom Domains für Embeds
- ❌ Kein Shopify/WordPress Plugin
- ❌ Keine USDZ-Konvertierung (Apple AR Quick Look)
- ❌ Kein Asset-Management (mehrere Modelle pro Ausstellung)
- ❌ Keine Team-Features (mehrere User pro Tenant)
- ❌ Landing Page hat keine Conversion-Optimierung
- ❌ Kein SEO/Blog Content

### Zielmarkt (validierte Hypothese)
- **Primär:** Möbelhersteller, Interior Design, Deko-Shops im DACH-Raum (DE/AT/CH)
- **Sekundär:** Schmuck, Mode-Accessoires, E-Commerce allgemein
- **NICHT:** Maschinenbau, Automotive, Medizintechnik (KI-Qualität reicht nicht)
- **Firmengröße:** 5-200 Mitarbeiter, 1-50M€ Umsatz
- **Buyer Persona:** Marketing-Leiter oder Geschäftsführer eines Möbelherstellers

### Wettbewerber
| Name | Preis | Stärke | Schwäche |
|---|---|---|---|
| Sketchfab | Free-$299/Mo | Große Community, Marktplatz | Entwickler-fokussiert, kein KI-Gen |
| Threekit | $50k+/Jahr | Enterprise-ready, Konfigurator | Zu teuer für KMU |
| Vectary | Free-$49/Mo | Guter Editor, Embeds | Kein KI-Gen, Designer-Tool |
| Roomle | Custom | Möbel-Konfigurator | Nur Möbel, kein Self-Service |
| Modelo.io | $29-99/Mo | Architektur-Fokus | Kein KI, kein KMU-Fokus |

### Unit Economics (Hypothese)
- KI-Generierung: ~$0.50-1.00 pro Modell (Tripo/Meshy)
- GLB-Hosting: ~$0.00 (Firebase Egress unter Free Tier)
- Ziel-Pricing: €49-149/Monat
- Ziel-Marge: >85% ab Monat 2 (Kunden generieren nach Onboarding kaum neue Modelle, hosten nur)

---

## Deep Think Aufgaben

### 1. Kritische Launch-Lücken
Was MUSS vor dem ersten zahlenden Kunden fertig sein? Priorisiere brutal. Nicht alles auf einmal.

### 2. Pricing-Architektur
Entwirf 3 Tier-Pläne (Free/Pro/Enterprise) mit konkreten Feature-Gates. Was ist der stärkste Conversion-Trigger von Free → Pro?

### 3. Embed-UX Optimierung
Der Embed-Viewer ist das Herzstück das der Endkunde sieht. Was fehlt damit ein Möbelhändler das stolz auf seiner Website zeigt? (Branding, Loading, Mobile, AR, Performance)

### 4. KI-Qualitätsproblem lösen
Single-Image-to-3D hat Qualitätsgrenzen (Rückseite halluziniert). Welche kreativen, technischen oder UX-seitigen Lösungen gibt es außer "bessere KI abwarten"?

### 5. Customer Acquisition für Bootstrapped Founder
Budget: ~0€. Welche konkreten Schritte bringen die ersten 5 zahlenden Kunden? LinkedIn? Kaltakquise-E-Mail templates? Partnerschaften?

### 6. Verteidigbare Moat
Was hindert Sketchfab/Vectary daran, morgen dasselbe Feature zu bauen? Wie baut ExhibitXR eine verteidigbare Position auf?

### 7. Mobile & AR
73% der E-Commerce-Besucher sind auf Mobile. Wie sollte der Embed-Viewer auf Mobile aussehen? Lohnt sich Apple AR Quick Look (USDZ) für Möbel?

### 8. Automatisierungs-Potenzial
Wo kann ExhibitXR Prozesse automatisieren die Kunden heute manuell machen? (z.B. Produktkatalog-Import, Batch-Generierung, Auto-Publish)

### 9. Technische Schulden
Welche Architektur-Entscheidungen sollten JETZT getroffen werden damit das Produkt bei 100+ Kunden nicht bricht? (Hosting, CDN, Rate Limiting, Queue)

### 10. Wow-Faktor
Was ist EIN Feature das bei einer Live-Demo den "Holy Shit"-Moment erzeugt und den Deal abschließt?
