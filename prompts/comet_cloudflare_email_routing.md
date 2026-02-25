# ☁️ Comet Browser Agent - Cloudflare Email Routing Setup

Diese Datei enthält den Prompt für deinen Browser-Agenten (Comet), um die kostenlose E-Mail-Weiterleitung in Cloudflare einzurichten. Damit werden alle E-Mails an `jonatan@3dsnap.de` automatisch an deine private Gmail-Adresse weitergeleitet.

---

## 🚀 Der Prompt für den Browser-Agenten

**Kopiere den gesamten folgenden Block und füge ihn bei deinem Browser-Agenten ein:**

```text
Du bist mein IT-Administrator. Gehe zu https://dash.cloudflare.com/ und logge dich ein (falls nötig, warte auf meine Bestätigung oder 2FA-Eingabe).
Wir müssen ein kostenloses E-Mail-Routing (Forwarding) für die Domain "3dsnap.de" einrichten.

Führe nacheinander exakt diese Schritte aus:

### 1. Domain auswählen und Email Routing öffnen
- Wähle auf dem Dashboard die Domain "3dsnap.de" aus.
- Navigiere in der linken Seitenleiste zum Menüpunkt "Email" und klicke dann auf "Email Routing" (E-Mail-Weiterleitung).
- Falls Email Routing für diese Domain noch nicht konfiguriert ist, klicke auf "Get started" (Erste Schritte) oder "Enable Email Routing".

### 2. Zieladresse (Destination Address) hinzufügen
- Gehe zum Tab "Destination addresses" (Zieladressen).
- Füge eine neue Zieladresse hinzu: "jonatankunisch@gmail.com".
- **WICHTIG:** Cloudflare wird jetzt eine Verifizierungs-E-Mail an diese Gmail-Adresse senden. Pausiere hier und sage mir im Chat Bescheid: "Ich habe die Verifizierungs-E-Mail gesendet. Bitte klicke auf den Link in deinem Gmail-Postfach und gib mir hier ein 'OK', wenn du fertig bist."
- *Warte auf mein 'OK', bevor du weitermachst.*

### 3. Routing-Regel (Custom Address) erstellen
- Gehe zum Tab "Routes" (Routen) oder "Custom addresses".
- Klicke auf "Create address" (Adresse erstellen) oder "Add rule".
- **Custom address (Benutzerdefinierte Adresse):** Trage hier "jonatan" ein (die Domain @3dsnap.de sollte bereits vorausgewählt sein).
- **Action (Aktion):** Wähle "Send to" (Senden an).
- **Destination address (Zieladresse):** Wähle die verifizierte Adresse "jonatankunisch@gmail.com" aus dem Dropdown-Menü.
- Speichere die Regel.

### 4. DNS Records aktualisieren
- Falls Cloudflare dich auffordert, fehlende DNS-Einträge (MX-Records und TXT-Records für SPF) hinzuzufügen, klicke auf den Button "Add records automatically" (Einträge automatisch hinzufügen) oder "Add records and enable", um das Setup abzuschließen.

Gib mir Bescheid, sobald das Routing aktiv ist und die DNS-Einträge gesetzt wurden.
```