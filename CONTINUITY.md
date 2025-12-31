## Goal (incl. success criteria):
- Replace TBD sections in `AGENTS.md` with accurate, concise English documentation of the current repository architecture, development workflow, and conventions.

## Constraints/Assumptions:
- Prefer “less is more”: keep docs minimal but actionable.
- Derive conventions from existing code/config/docs; mark uncertainties as UNCONFIRMED.
- Do not change git branch/commit/push from this environment.

## Key decisions:
- Create `CONTINUITY.md` (it was missing) because `AGENTS.md` requires it as the canonical ledger.

## State:
- Repo is a pnpm/turbo monorepo with `apps/*`, `packages/*`, and `internal-packages/*`.
- `AGENTS.md` currently contains TBD sections for Architecture, Development Workflow, and Key Conventions.

## Done:
- Created `CONTINUITY.md` ledger file.
- Replaced TBD sections in `AGENTS.md` with an English guide describing repo architecture, workflow, conventions, and error-handling patterns.

## Now:
- Verify `AGENTS.md` content matches current repo structure and references real files.

## Next:
- (Optional) Adjust wording if any referenced paths/packages are renamed.

## Open questions (UNCONFIRMED if needed):
- UNCONFIRMED: Whether contributors prefer `.env.local` at repo root vs per-app for local development (both patterns exist in docs).

## Working set (files/ids/commands):
- Files: `AGENTS.md`, `CONTINUITY.md`
