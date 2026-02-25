# Snap -> Editor Live Run (2026-02-25)

Status dieses Durchlaufs: **teilweise ausgefuehrt** (Automation durch Sandbox-Rechte fuer Browser-Spawn blockiert).

## Ausgefuehrt

- [x] Build-Validierung erfolgreich (`npm run build`).
- [x] Produktionsserver lokal gestartet (`npm start`) und erreichbar auf `http://localhost:3000`.
- [x] Playwright-CLI initialisiert (lokaler npm-cache Workaround gesetzt).
- [x] Blocker reproduziert: Browser-Start in Sandbox liefert `spawn EPERM` / `operation not permitted`.

## Nicht ausfuehrbar in dieser Session (ohne Escalation)

- [ ] Echter Browser-E2E-Flow (Upload, CTA-Klick, Redirect, Editor-Render).
- [ ] Auth-gebundene Dashboard-Checks mit bestehender Session-Cookie.
- [ ] Network/Console-Inspektion im laufenden Browser.

## Was bereits technisch abgesichert ist (Code + Build)

- [x] CTA-Overlay-Layering gefixt (Landing-Gradient unter Snap-Container).
- [x] SnapHandoff Redirect gehaertet (`router.replace` + hard fallback via `window.location.assign`).
- [x] SnapHandoff idempotent gegen Remount/Race (sessionStorage Lock + Retry).
- [x] Fehlerfall im Handoff hat sichtbares Recovery-UI (`Erneut versuchen` / `Abbrechen`).

## Manuelle Kurzpruefung (5 Minuten)

- [ ] `npm run dev` lokal in normaler Shell starten.
- [ ] Auf `/` ein Foto hochladen und auf `SUCCESS` warten.
- [ ] CTA `Im Studio oeffnen` visuell pruefen (nicht abgedunkelt, klickbar).
- [ ] CTA klicken und direktes Ziel pruefen: `/dashboard/editor/{id}`.
- [ ] Im Editor pruefen: Modell sichtbar, kein dauerhafter Spinner.
- [ ] Bei Fehlerfall pruefen: Handoff-Overlay zeigt Recovery-Aktionen.

## Falls Redirect erneut haengt

- [ ] In `Application -> Local Storage` Keys pruefen:
  - [ ] `pending_snap_url`
  - [ ] `pending_snap_handoff_lock`
- [ ] Console auf diese Prefixe filtern:
  - [ ] `SnapHandoff Error:`
  - [ ] `SnapHandoff Exception:`
  - [ ] `[snap-preview] Poll error`
  - [ ] `[snap-preview] Poll exception`
