# ExhibitXR - Architecture (Agent-Optimized)

## Product
ExhibitXR is a multi-tenant B2B SaaS for interactive 3D product experiences in the browser.

## Core capabilities
- Embeddable 3D viewer (`/embed/[id]`)
- Configurable models (variant system)
- Hotspots with rich product info
- Dashboard for non-technical teams
- Tenant-safe data isolation

## Technical baseline
- Next.js 15 App Router + React 19 + TypeScript strict
- React Three Fiber + Drei for 3D rendering
- Zustand for local interaction state
- Firebase Auth + Firestore + Functions
- Cloudflare R2 for large asset uploads
- Zod for runtime schema validation

## Non-negotiables
1. `src/types/schema.ts` is single source of truth
2. Firestore queries are always tenant-scoped
3. Admin SDK is server-side only
4. Performance-sensitive R3F loops use transient state reads

## Delivery phases
### Phase 0 (done)
- Repo, standards, agent instructions, docs baseline

### Phase 1
- Scaffold app
- Implement schema + firebase init + validation
- Build viewer + embed route + hotspots + configurator

### Phase 2
- Firestore collections + security rules
- R2 presigned upload flow
- Dashboard CRUD for exhibitions

### Phase 3
- AI text advisor with exhibit context
- Generated environment backgrounds

### Phase 4
- Stripe billing + entitlement checks
- View limits + analytics event pipeline

### Phase 5
- Marketing site + mobile/perf hardening + legal launch