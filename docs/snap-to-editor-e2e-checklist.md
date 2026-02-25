# Snap -> Dashboard -> Editor E2E Checklist

Dieses Runbook validiert den kompletten Nutzerfluss vom Landing-Upload bis zum geladenen Modell im Editor.

## 1) Vorbereitung

- [ ] Browser DevTools oeffnen (`Network` + `Console`, Preserve log aktivieren).
- [ ] In derselben Browser-Session eingeloggt sein (gueltiger `session` Cookie fuer `/dashboard`).
- [ ] Optional: dev cache reset vor Start:
  - [ ] Dev-Server stoppen.
  - [ ] `.next` loeschen.
  - [ ] `npm run dev` neu starten.
- [ ] Auf Landing starten: `/`

## 2) Happy Path: Snap erzeugen und direkt im Editor landen

- [ ] In `HomeSnapModule` ein Bild hochladen.
- [ ] Erwartung: UI State wechselt `IDLE -> UPLOADING -> PROCESSING`.
- [ ] Erwartung Network: `POST /api/snap-preview` -> `200` mit `{ taskId, provider }`.
- [ ] Erwartung Polling: wiederholtes `GET /api/snap-preview/{taskId}?provider=...`.
- [ ] Erwartung nach Erfolg: Polling endet, Status `SUCCESS`, `EmbedViewer` sichtbar, CTA `Im Studio oeffnen`.
- [ ] CTA visuell pruefen:
  - [ ] Button ist nicht abgedunkelt.
  - [ ] Button ist klar klickbar.
- [ ] CTA klicken.
- [ ] Erwartung:
  - [ ] `localStorage.pending_snap_url` wird gesetzt.
  - [ ] Navigation zu `/dashboard`.
  - [ ] `SnapHandoff` Overlay erscheint (`Studio wird vorbereitet`).
- [ ] Erwartung Server Action:
  - [ ] `createExhibitionAction` erstellt neue Exhibition mit `glbUrl`.
- [ ] Erwartung Redirect:
  - [ ] Navigation zu `/dashboard/editor/{newExhibitionId}`.
- [ ] Erwartung Editor:
  - [ ] `EditorShell` laedt ohne dauerhaften Spinner.
  - [ ] Modell wird im Viewer gerendert.

## 3) Datenintegritaet im Zielzustand

- [ ] Firestore-Dokument unter `/tenants/{tenantId}/exhibitions/{id}` pruefen:
  - [ ] `glbUrl` vorhanden.
  - [ ] `model.glbUrl` vorhanden.
  - [ ] `environment` gesetzt (`studio` im Snap-Flow).
- [ ] Embed-Preview pruefen:
  - [ ] `GET /embed/{id}` laedt ohne Fehler.
  - [ ] Modell sichtbar.

## 4) Negative Tests (gezielt)

- [ ] Plan-Limit erzwingen (oder simulieren) und CTA-Flow erneut testen.
- [ ] Erwartung:
  - [ ] `SnapHandoff` zeigt Fehler-Overlay.
  - [ ] `Erneut versuchen` funktioniert.
  - [ ] `Abbrechen` entfernt `pending_snap_url`.
- [ ] Netzwerkfehler waehrend Polling simulieren.
- [ ] Erwartung:
  - [ ] Nach max. Fehlern sauberes `ERROR`-State statt Endlos-Spinner.

## 5) Redirect-Stabilitaet / Race-Checks

- [ ] Test in Dev (`npm run dev`) und Prod Build (`npm run build && npm start`) durchfuehren.
- [ ] In Dev Seite waehrend Handoff einmal hart neuladen.
- [ ] Erwartung:
  - [ ] Kein Duplikat-Import.
  - [ ] Locking/Retry fuehrt dennoch in den Editor.

## 6) Diagnose-Hinweise (bei Fail)

- [ ] `Console` nach diesen Praefixen filtern:
  - [ ] `SnapHandoff Error:`
  - [ ] `SnapHandoff Exception:`
  - [ ] `[snap-preview] Poll error`
  - [ ] `[snap-preview] Poll exception`
- [ ] `Application -> Local Storage` pruefen:
  - [ ] `pending_snap_url`
  - [ ] `pending_snap_handoff_lock`
- [ ] Falls UI stale wirkt:
  - [ ] Hard refresh (`Ctrl+Shift+R`) und `.next`-Reset wiederholen.

## 7) Abnahme-Kriterien

- [ ] CTA ist lesbar/klickbar (kein Overlay-Shadowing).
- [ ] Ein Klick auf `Im Studio oeffnen` endet reproduzierbar im Editor (`/dashboard/editor/{id}`).
- [ ] Neues Modell ist sofort im Editor sichtbar.
- [ ] Kein Endlos-Spinner bei Fehlern.
- [ ] Fehlerfaelle liefern sichtbares, bedienbares Recovery im UI.
