# ExhibitXR - Coding Conventions

## TypeScript
- strict mode, kein `any`, kein `as unknown as X`
- Alle Props als Interface
- Zod-Schemas in `schema.ts`, Types via `z.infer<>`

## R3F
- 3D-Komponenten: `'use client'`
- `useFrame` mit `delta`
- Zustand in `useFrame` nur via `getState()`
- Konfigurierbare Meshes: Prefix `VAR__`
- Keine rohe Three.js-Mathe wenn Alternative existiert

## Firebase
- Client SDK nur in `'use client'` Komponenten
- Admin SDK nur in Server Actions / API Routes / server-side auth checks
- Firestore-Pfade: `/tenants/{tenantId}/exhibitions/{exhibitionId}`
- Storage-Pfade: `/tenants/{tenantId}/models/{file}`
- Security Rules: tenantId gegen Auth-Token pruefen
- Kein Zugriff ohne tenantId-Filter
- Dashboard-Auth SSR-sicher ueber Session-Cookies

## Next.js
- Server Components by default
- `'use client'` nur fuer interaktive Bereiche
- Server Actions statt API Routes wo moeglich

## Git
- Commit nach jedem Feature
- Format: `feat|fix|chore: kurze beschreibung`
- Feature-Branches: `feature/[name]`

## Arbeitsdisziplin
- Aufgaben als Checkbox-Listen planen und tracken (`- [ ]` / `- [x]`)
- Aufgaben end-to-end selbst ausfuehren, keine halbfertigen Uebergaben
- Bei Blockade: nichts kaputt machen, klaren Fehlerstatus dokumentieren
