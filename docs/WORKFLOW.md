# Multi-Agent Workflow (SOTA Baseline)

## Goal
Enable fast parallel development with multiple coding agents while protecting architecture and type safety.

## Work model
1. Create one worktree per major stream:
   - `feature/viewer-core`
   - `feature/firebase-backend`
   - `feature/dashboard-ui`
2. Assign exactly one primary owner-agent per branch.
3. Merge only via PR with mandatory checks.

## Required artifacts per PR
- Updated `docs/DECISIONS.md` entry
- Short risk note (what could break)
- Validation evidence (commands + results)
- Checklist of completed tasks (`- [x]`)

## Conflict prevention
- `src/types/schema.ts` is protected: only owner with explicit approval edits it
- Shared UI tokens live in one source; no duplicate style systems
- Tenant-scoping rules are non-negotiable in all data access code

## Daily cadence
- Morning: sync + choose one priority per branch
- During day: commit small slices
- End of day: handoff note + open PR draft

## Execution discipline
- No laziness: each task is completed end-to-end by the assigned owner
- No handholding mode: unblock independently and ship concrete outcomes
- If blocked, do not break working code; stop and report failure clearly
