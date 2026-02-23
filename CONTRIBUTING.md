# Contributing

## Branch strategy
- `main`: production-ready
- `feature/*`: normal feature work
- `fix/*`: bugfixes
- `chore/*`: maintenance

## Commit format
- `feat: ...`
- `fix: ...`
- `chore: ...`

## Required checks (when app is scaffolded)
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Multi-agent rule
- One agent per branch/worktree
- No direct pushes to `main`
- Every PR references updated `docs/DECISIONS.md`