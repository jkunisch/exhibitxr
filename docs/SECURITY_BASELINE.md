# Security Baseline

## Secrets
- Never commit `.env.local`
- Firebase Admin key only server-side
- Rotate Firebase service account credentials if exposed

## AuthN/AuthZ
- Firebase Auth required for dashboard
- Session-cookie auth for SSR-safe dashboard access
- Custom claim `tenantId` is the primary tenant boundary
- Tenant boundary enforced at rules level
- Published embeds may be public read-only (explicit flag)

## Input validation
- Parse all exhibit configs with Zod
- Fail closed on invalid data

## Logging
- Do not log secrets
- Log trace IDs for server actions
