# Phase 4C – Codex IDE
# Dashboard: GLB-Upload (Firebase Storage) + Editor-Links

Lies zuerst:
- `AGENTS.md`
- `src/types/schema.ts`
- `src/lib/storage.ts` (Firebase Storage Upload – MUSS VORHER VON GEMINI ERSTELLT SEIN)
- `src/app/(dashboard)/dashboard/exhibitions/new/` (Formular)
- `src/app/(dashboard)/dashboard/exhibitions/page.tsx` (Liste)
- `src/app/(dashboard)/dashboard/exhibitions/[id]/` (Detail)
- `src/app/actions/exhibitions.ts` (CRUD Server Actions)

Strikte Regeln:
- Run `npm run build` after modifying TypeScript files
- TypeScript strict, kein `any`
- Firebase Client SDK nur in `'use client'` Komponenten
- Tailwind fuer UI

Abhaengigkeit: Phase 4B (Gemini Firebase Upload) muss abgeschlossen sein.
Erwartet wird: `src/lib/storage.ts` mit `uploadGlbFile(tenantId, file, onProgress)`.

Checkliste:

- [ ] GLB-Upload in Exhibitions-Formular (`exhibitions/new/page.tsx`):
  - File-Input fuer `.glb` Dateien (max 50MB, accept=".glb")
  - Upload-Flow (Client-Side, `'use client'`):
    1. User waehlt GLB-Datei
    2. Validierung: .glb Extension, max 50MB
    3. `uploadGlbFile(tenantId, file, onProgress)` aufrufen
    4. Progress-Bar waehrend Upload (prozentual)
    5. Nach Erfolg: `glbUrl` (Download-URL) ins Formular-State setzen
  - Upload-Status UI: idle → uploading (%) → done ✓ → error ✗
  - User muss eingeloggt sein (tenantId aus Auth-Context holen)

- [ ] Editor-Link in Exhibitions-Liste (`exhibitions/page.tsx`):
  - Jede Exhibition bekommt einen "Bearbeiten" Button/Link
  - Link geht zu `/dashboard/editor/{exhibitId}` (Phase 3 Editor)
  - Visuell: kleines Stift-Icon (Lucide `Pencil`)

- [ ] Editor-Link in Exhibition-Detail (`exhibitions/[id]/page.tsx`):
  - "Im Editor oeffnen" Button prominent anzeigen
  - Link zu `/dashboard/editor/{exhibitId}`

- [ ] Exhibitions CRUD Server Actions erweitern (`actions/exhibitions.ts`):
  - `createExhibitionAction`: `glbUrl` Feld hinzufuegen (optional string)
  - `updateExhibitionAction`: `glbUrl` Feld hinzufuegen
  - Bei Create: vollstaendiges `model`-Objekt in Firestore speichern:
    ```
    model: {
      id: crypto.randomUUID(),
      label: title,
      glbUrl: glbUrl || "",
      scale: 1,
      position: [0, 0, 0],
      variants: [],
      hotspots: []
    }
    ```

- [ ] Embed-Link anzeigen:
  - In Exhibition-Detail: kopierbaren Embed-Link anzeigen
  - Format: `<iframe src="${origin}/embed/{exhibitId}" width="100%" height="600" frameborder="0"></iframe>`
  - Copy-to-Clipboard Button mit Feedback ("Kopiert!")

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Screenshots (falls UI-Aenderungen)
