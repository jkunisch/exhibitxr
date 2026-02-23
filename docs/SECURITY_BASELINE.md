# Security Baseline

## Secrets
- Never commit `.env.local`
- Firebase Admin key only server-side
- Rotate Firebase service account credentials if exposed

## AuthN/AuthZ
- Firebase Auth required for dashboard
- Session-cookie auth for SSR-safe dashboard access
- Custom claim `tenantId` is the primary tenant boundary
- After claim updates, clients must call `await user.getIdToken(true)` before data access
- Tenant boundary enforced at rules level
- Published embeds may be public read-only (explicit flag)

## Input validation
- Parse all exhibit configs with Zod
- Fail closed on invalid data
- All inputs for Server Actions (especially Auth) are parsed and sanitized using Zod

## Logging
- Do not log secrets
- Log trace IDs for server actions

## Rule Testing Checkpoints
- **Membership Isolation:** An authenticated user of Tenant A CANNOT read/write any document/asset under Tenant B's path.
- **Tenant Doc Mutation:** Only users with `role == "owner"` inside their custom claims can mutate the tenant document or membership documents. Regular members can only read.
- **Publish State Readability:** Unauthenticated users CANNOT read an exhibition or model asset UNLESS the `isPublished` field/metadata is strictly evaluated to `true`.
- **Default Deny Check:** Any path outside explicitly defined `/tenants/{tenantId}` sub-trees MUST be denied by default.
