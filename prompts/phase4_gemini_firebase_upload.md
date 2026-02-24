# Phase 4B – Gemini CLI
# Firebase Storage Upload + Embed aus Firestore

Lies zuerst:
- `GEMINI.md`
- `src/types/schema.ts`
- `src/lib/firebaseAdmin.ts`
- `src/lib/firebase.ts`
- `firebase/storage.rules` (tenant-scoped, isPublished Metadata)
- `src/app/embed/[id]/page.tsx` (aktuell: Collection Group Query, OK)
- `src/app/actions/upload.ts` (aktuell: R2 Presigned URL – MUSS ERSETZT WERDEN)

Strikte Regeln:
- Server Actions statt API Routes
- Firebase Storage Client SDK fuer Uploads (NICHT Cloud Storage Admin)
- Upload-Logik gehoert in eine Client-Utility, nicht in eine Server Action
- Storage-Pfad IMMER tenant-scoped: `/tenants/{tenantId}/models/{timestamp}-{filename}`
- TypeScript strict, kein `any`

Checkliste:

- [ ] LOESCHE `src/app/actions/upload.ts` (R2 Presigned URL – wird nicht mehr gebraucht)

- [ ] Erstelle `src/lib/storage.ts` (Client-Side Firebase Storage Utility):
  - `'use client'` oder reiner ES-Module Import
  - Importiere `ref, uploadBytesResumable, getDownloadURL` von `firebase/storage`
  - Importiere `storage` von `@/lib/firebase`
  - Exportiere Funktion:
    ```
    uploadGlbFile(tenantId: string, file: File, onProgress?: (pct: number) => void): Promise<string>
    ```
  - Storage-Pfad: `tenants/${tenantId}/models/${Date.now()}-${sanitizedFileName}`
  - Setze customMetadata: `{ tenantId, isPublished: "false", originalName: file.name }`
  - Nutze `uploadBytesResumable` fuer Progress-Callback
  - Nach Upload: `getDownloadURL()` zurueckgeben
  - Fehlerbehandlung: Firebase Storage Errors abfangen und lesbare Message werfen
  - Nur `.glb` Dateien erlauben (Validierung vor Upload)
  - Max 50MB Check vor Upload

- [ ] Embed-Route pruefen (`src/app/embed/[id]/page.tsx`):
  - Sicherstellen: Collection Group Query + isPublished Check funktioniert weiterhin
  - parseExhibitConfig() Validierung bleibt
  - Demo-Fallback fuer id="demo" bleibt
  - KEINE Aenderung noetig wenn aktueller Code schon korrekt ist

- [ ] R2 env-Variablen aus `.env.example` entfernen:
  - R2_ACCESS_KEY_ID → loeschen
  - R2_SECRET_ACCESS_KEY → loeschen
  - R2_BUCKET_NAME → loeschen
  - R2_ENDPOINT → loeschen
  - R2_PUBLIC_URL → loeschen

- [ ] `@aws-sdk/client-s3` und `@aws-sdk/s3-request-presigner` deinstallieren:
  ```
  npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  ```

- [ ] Validierung:
  - `npm run lint`
  - `npm run build`

Ergebnisformat:
- Erledigte Checkboxen
- Geaenderte Dateien
- Entfernte npm-Packages
- Offene Risiken
