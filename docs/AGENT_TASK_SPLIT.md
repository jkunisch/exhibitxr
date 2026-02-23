# Agent Task Split

## Branch/worktree setup
```bash
git worktree add ../exhibitxr-viewer feature/viewer-core
git worktree add ../exhibitxr-backend feature/firebase-backend
git worktree add ../exhibitxr-dashboard feature/dashboard-ui
```

## Suggested ownership
- Viewer agent: `src/components/3d`, `src/data`, `src/app/embed/[id]`
- Backend agent: `src/lib/firebase*`, `src/app/actions`, `firebase/*.rules`, `middleware.ts`
- Dashboard agent: `src/app/(dashboard)`, `src/components/ui`

## Merge order
1. schema + shared types baseline
2. backend tenant-safe data layer
3. dashboard CRUD
4. embed runtime integration
