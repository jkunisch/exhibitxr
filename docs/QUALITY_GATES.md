# Quality Gates

## Mandatory (after app scaffold)
1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`

## Runtime checks
1. Viewer loads demo config
2. Embed route renders without dashboard chrome
3. Hotspot select/close works
4. Invalid config shows explicit error overlay

## Data safety checks
1. Every Firestore query is tenant-scoped
2. Security rules validate `request.auth.token.tenantId`
3. Admin SDK used only server-side