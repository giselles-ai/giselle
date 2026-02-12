# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix generation-origin spoofing risk on Studio Server Actions.
- Ensure new generation creation paths do not trust client-provided `origin.type`.
- Start this work from `main` on a dedicated fix branch.

## Goal (incl. success criteria)

- On Studio Server Action create paths (`setGeneration`, `startContentGeneration`), force `generation.context.origin.type` to `"studio"`.
- Preserve existing behavior for update paths and non-origin fields.
- Keep touched files lint-clean and minimally scoped.

## Constraints/Assumptions

- Follow existing authorization and validation patterns in `apps/studio.giselles.ai/lib/internal-api`.
- Do not broaden scope beyond this spoofing fix.
- Keep implementation simple and explicit.

## Key decisions

- Create branch `fix/force-studio-origin-on-generation-create` from updated `main` before code changes.
- Add a server-side origin-sanitization step only in new-generation create branches.

## State

- Branch created from latest `main`.
- Previous branch local WIP was stashed before branch switch.

## Done

- Confirmed local branch list and working tree state.
- Stashed unrelated uncommitted changes from previous branch.
- Updated `main` with fast-forward pull from `origin/main`.
- Created branch `fix/force-studio-origin-on-generation-create`.
- Created this branch continuity ledger.
- Updated `apps/studio.giselles.ai/lib/internal-api/generations.ts`:
  - Added `enforceStudioOriginForCreation(generation)` helper.
  - Applied helper in `setGeneration` create path.
  - Applied helper in `startContentGeneration` create path.
- Verified formatting/check on the touched file with `pnpm biome check`.

## Now

- Studio Server Action create paths now normalize incoming origin type to `studio`.

## Next

- Optionally add regression tests around create-path origin normalization in internal API layer.
- If requested, run broader workspace checks (`pnpm check-types`, targeted tests).

## Open questions (UNCONFIRMED if needed)

- Should invalid incoming create-path origin types be silently normalized or explicitly rejected with an error?

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/lib/internal-api/generations.ts`
- `.continuity/20260211-101817-fix__force-studio-origin-on-generation-create.md`
- `git stash push -m "wip-old-branch-ledger-note"`
- `git checkout main && git pull --ff-only`
- `git checkout -b fix/force-studio-origin-on-generation-create`

