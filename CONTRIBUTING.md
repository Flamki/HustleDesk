# Contributing

## Development Workflow
1. Create a branch for your change.
2. Keep changes scoped and reviewable.
3. Run validation before opening PR.

## Local Setup
```bash
npm install
npm run dev
```

## Quality Gates
Before PR:
```bash
npx tsc --noEmit
npm run build
```

For performance-sensitive changes:
```bash
npm run loadtest:jobs
npm run loadtest:dashboard
npm run loadtest:time
```

## Coding Rules
- Keep API input validation strict.
- Do not expose server-only secrets to client code.
- Avoid destructive schema changes without migrations and rollback notes.
- Prefer small, incremental PRs with clear changelogs.

## Documentation
If behavior changes, update:
- `README.md`
- `docs/API_REFERENCE.md`
- `docs/DEPLOYMENT.md` (if env/deploy affected)
- `DEPLOYMENT_CHECKLIST.md` (if production requirements changed)
