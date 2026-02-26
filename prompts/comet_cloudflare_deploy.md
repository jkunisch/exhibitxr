# ☁️ Comet Browser Agent - Cloudflare Pages Deployment Setup

Diese Datei enthält den exakten Prompt für deinen Browser-Agenten (Comet), um dein Next.js Projekt fehlerfrei auf **Cloudflare Pages** zu deployen, inklusive aller wichtigen Einstellungen für Stripe, Firebase und Node.js-Kompatibilität.

---

## 🚀 Der Prompt für den Browser-Agenten

**Kopiere den gesamten folgenden Block und füge ihn bei deinem Browser-Agenten ein:**

```text
Du bist mein DevOps Engineer. Gehe zu https://dash.cloudflare.com/ und logge dich ein (falls nötig, warte auf meine Bestätigung oder 2FA-Eingabe).
Unsere Aufgabe ist es, das Next.js 15 Projekt "3D-Snap" (Repository: exhibitxr) auf Cloudflare Pages zu deployen.

Führe nacheinander exakt diese Schritte aus:

### 1. Projekt in Cloudflare Pages anlegen
1. Navigiere in der linken Seitenleiste zu "Workers & Pages".
2. Klicke auf "Create application" (Anwendung erstellen) und wechsle zum Tab "Pages".
3. Klicke auf "Connect to Git" (Mit Git verbinden).
4. Wähle das GitHub-Konto aus und wähle das Repository "exhibitxr" (oder das Repository, in dem der 3D-Snap Code liegt).
5. Klicke auf "Begin setup" (Setup beginnen).

### 2. Build-Einstellungen konfigurieren
Stelle sicher, dass im Setup-Screen folgende Werte gesetzt sind:
- **Project name:** 3d-snap (oder ähnlich)
- **Production branch:** main
- **Framework preset:** Wähle zwingend "Next.js" aus der Dropdown-Liste.
- **Build command:** npx @cloudflare/next-on-pages (oder `npm run build`, falls Cloudflare das automatisch für Next.js vorschlägt).
- **Build output directory:** .vercel/output/static

### 3. Environment Variables (Umgebungsvariablen) eintragen
Klicke auf "Environment variables (advanced)" und füge folgende Keys hinzu. 
**WICHTIG:** Da du meine geheimen Schlüssel nicht kennst, trage als Value überall "HIER_EINTRAGEN" ein. Ich werde die echten Werte später manuell nachpflegen. Füge diese Keys hinzu:
- NEXT_PUBLIC_APP_URL (Value: https://3d-snap.com)
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_STARTER
- STRIPE_PRICE_PRO
- MESHY_API_KEY
- TRIPO_API_KEY

### 4. Setup vorbereiten (WICHTIG: NICHT DEPLOYEN!)
- Scrolle nach unten, aber **klicke noch NICHT auf "Save and Deploy"**. 
- Bleibe exakt auf dieser Seite stehen.

### 5. Bestätigung anfordern
Gib mir im Chat folgende exakte Rückmeldung: "Ich habe das Projekt und alle Umgebungsvariablen-Platzhalter vorbereitet. Bitte trage jetzt auf dem Bildschirm deine echten Stripe-, Firebase- und API-Keys ein. Wenn du fertig bist, klicke selbst auf 'Save and Deploy'. Sag mir danach Bescheid, damit ich im Anschluss das 'nodejs_compat' Flag in den Einstellungen aktivieren kann."

- **STOPPE HIER.** Warte auf meine Rückmeldung, dass das erste Deployment gestartet wurde.

### 6. Node.js Kompatibilität aktivieren (Erst NACH meinem OK!)
Sobald ich dir im Chat sage "Ich habe deployt", führe diese letzten Schritte aus:
1. Gehe in die "Settings" (Einstellungen) des Cloudflare Pages Projekts.
2. Navigiere zu "Functions" (oder "Build & deployments" je nach UI) und scrolle zu "Compatibility flags" (Kompatibilitäts-Flags).
3. Füge das Flag `nodejs_compat` für Production und Preview hinzu.
4. Speichere die Einstellungen und sage mir Bescheid: "Das nodejs_compat Flag ist gesetzt. Du kannst jetzt in Cloudflare auf 'Retry deployment' klicken, um die App endgültig live zu schalten!"
```