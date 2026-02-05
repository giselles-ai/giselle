# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Add authorization checks to `triggers.ts` following the pattern from `secrets.ts`
- Extract `assertWorkspaceAccess` to `utils.ts` for shared use
- Handle `getGitHubRepositoryFullname` in a separate PR (requires API change)

## Goal (incl. success criteria)

- Add authorization checks to all functions in `triggers.ts` (except `getGitHubRepositoryFullname`)
- Ensure users can only access workspaces they are members of
- Success criteria: `pnpm format`, `pnpm check-types`, `pnpm tidy`, `pnpm test` all pass

## Constraints/Assumptions

- `assertWorkspaceAccess` should be in `utils.ts` without `"use server"` directive
- `getGitHubRepositoryFullname` requires API change to add workspaceId, handled in separate PR
- Authorization pattern follows `secrets.ts`

## Key decisions

- Create new `utils.ts` with shared `assertWorkspaceAccess` helper
- Refactor `secrets.ts` to use `utils.ts`
- Functions that need to fetch trigger first (`getTrigger`, `reconfigureGitHubTrigger`) call giselle.getTrigger to get workspaceId

## State

- Implementation complete, all tests passing

## Done

- Created `utils.ts` with `assertWorkspaceAccess` implementation
- Refactored `secrets.ts` to use `utils.ts`
- Added authorization to `triggers.ts`:
  - `resolveTrigger`, `executeAction`, `executeQuery`, `executeDataQuery` - extract from `generation.context.origin.workspaceId`
  - `configureTrigger`, `setTrigger` - extract from `input.trigger.workspaceId`
  - `getTrigger`, `reconfigureGitHubTrigger` - fetch trigger first to get workspaceId
  - `getGitHubRepositoryFullname` - added `workspaceId` to input (internal-api layer only)
- Updated `GiselleClient` interface to include `workspaceId` in `getGitHubRepositoryFullname`
- Updated callers to pass `workspaceId`:
  - `use-github-trigger.ts` - uses `trigger.workspaceId`
  - `github-action-configured-view.tsx` - uses `useAppDesignerStore`
  - `github-repository-badge-from-repo.tsx` - uses `useAppDesignerStore`
- All checks pass: `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, `pnpm test`

## Now

- Complete

## Next

- Commit & create PR

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/lib/internal-api/utils.ts` (new file)
- `apps/studio.giselles.ai/lib/internal-api/secrets.ts` (refactored)
- `apps/studio.giselles.ai/lib/internal-api/triggers.ts` (authorization added)
