# Security Baseline

## Secrets
- Never commit `.env.local`
- Firebase Admin key only server-side
- Rotate R2 keys if exposed

## AuthN/AuthZ
- Firebase Auth required for dashboard
- Tenant boundary enforced at rules level
- Published embeds may be public read-only (explicit flag)

## Input validation
- Parse all exhibit configs with Zod
- Fail closed on invalid data

## Logging
- Do not log secrets
- Log trace IDs for server actions