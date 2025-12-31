# Continuity Ledger (compaction-safe)

## Goal (incl. success criteria):
- Replace `TBD` sections in `AGENTS.md` with accurate English documentation for this repo.
- Keep the ledger updated after each file edit (this file is that ledger).

## Constraints/Assumptions:
- Keep docs concise and consistent with existing repo conventions.
- Don’t invent architecture details that aren’t supported by the repository structure/scripts.

## Key decisions:
- Document architecture at the monorepo/app/package level (pnpm workspace + Turborepo), not deep internals.

## State:
- `AGENTS.md` now describes architecture, workflow, conventions in English.
- `CONTINUITY.md` created to satisfy repo continuity rules.

## Done:
- Updated `AGENTS.md` to remove `TBD` blocks (Architecture / Development Workflow / Conventions).

## Now:
- Run required repo commands: `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, `pnpm test`.

## Next:
- Fix any formatting/type/test/tidy failures if they occur.

## Open questions (UNCONFIRMED if needed):
- UNCONFIRMED: Whether any additional project-specific error-handling conventions exist beyond the general guidance documented.

## Working set (files/ids/commands):
- Files: `AGENTS.md`, `CONTINUITY.md`
- Commands: `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, `pnpm test`
