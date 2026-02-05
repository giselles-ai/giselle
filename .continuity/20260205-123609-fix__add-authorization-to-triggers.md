# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Add authorization checks to `triggers.ts` following the pattern from `secrets.ts`
- Extract `assertWorkspaceAccess` to a shared location for reuse
- Handle `getGitHubRepositoryFullname` by adding `workspaceId` to internal-api layer only

## Goal (incl. success criteria)

- Add authorization checks to all functions in `triggers.ts` (except `getGitHubRepositoryFullname`)
- Ensure users can only access workspaces they are members of
- Success criteria: `pnpm format`, `pnpm check-types`, `pnpm tidy`, `pnpm test` all pass

## Constraints/Assumptions

- `assertWorkspaceAccess` should be in `lib/assert-workspace-access.ts` (not inside `internal-api/` to avoid confusion)
- Authorization pattern follows `secrets.ts`

## Key decisions

- Create `lib/assert-workspace-access.ts` with shared `assertWorkspaceAccess` helper (outside `internal-api/` since it's a helper, not a Server Action)
- Refactor `secrets.ts` to use the shared helper
- Functions that need to fetch trigger first (`getTrigger`, `reconfigureGitHubTrigger`) call giselle.getTrigger to get workspaceId
- `getGitHubRepositoryFullname` adds `workspaceId` only at internal-api/react layer, not giselle SDK

## State

- Implementation complete, all tests passing

## Done

- Created `lib/assert-workspace-access.ts` with `assertWorkspaceAccess` implementation
- Refactored `secrets.ts` to use `lib/assert-workspace-access.ts`
- Refactored `triggers.ts` to use `lib/assert-workspace-access.ts`
- Deleted `internal-api/utils.ts` (moved to `lib/assert-workspace-access.ts` to avoid confusion with Server Actions)
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

- `apps/studio.giselles.ai/lib/assert-workspace-access.ts` (new file)
- `apps/studio.giselles.ai/lib/internal-api/secrets.ts` (refactored)
- `apps/studio.giselles.ai/lib/internal-api/triggers.ts` (authorization added)
- `packages/react/src/giselle-client.ts` (updated interface)
- `internal-packages/workflow-designer-ui/src/editor/lib/use-github-trigger.ts` (pass workspaceId)
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/action-node-properties-panel/ui/github-action-configured-view.tsx` (pass workspaceId)
- `internal-packages/workflow-designer-ui/src/editor/node/ui/github-repository-badge-from-repo.tsx` (pass workspaceId)
