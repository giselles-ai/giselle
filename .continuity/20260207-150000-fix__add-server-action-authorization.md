# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add authorization checks to all Server Actions outside `internal-api` that lack proper access control
- Prevent unauthorized access to workspace/team resources via direct Server Action calls (bypassing page-level auth)
- Flag complex authorization cases for manual review

## Goal (incl. success criteria)

- Every exported Server Action that mutates or reads protected resources must verify the caller has access
- Use `assertWorkspaceAccess` for workspace-scoped actions; `fetchCurrentTeam()` for team-scoped actions
- Report complex cases that need design decisions

## Constraints/Assumptions

- `fetchCurrentTeam()` validates membership via SQL JOIN with `teamMemberships` + `supabaseUserMappings`, falling back to the user's first team if the session team is invalid
- `setCurrentTeam()` in team-switcher validates via `fetchUserTeams()`
- Auth actions (`(auth)/*`) are pre-authentication and need no authorization
- `internal-api/*` was already hardened in a prior session

## Key decisions

- `stage/showcase/[appId]/actions.ts`: replaced client-provided `teamId` with workspace's `teamDbId` from DB in `runWorkspaceApp` to ensure correct team association for `acts` records
- `manage-billing.ts`: added `fetchCurrentTeam()` check to verify `subscriptionId` matches the current team's active subscription
- `create-and-start-task.ts`: replaced local `assertCanAccessWorkspace` with shared `assertWorkspaceAccess` to eliminate duplication
- `settings/account/actions.ts`: replaced `updateGiselleSession({ teamId })` with `setCurrentTeam(teamId)` in `navigateWithChangeTeam` and `leaveTeam` for consistency with team-switcher pattern and to prevent session pollution with unvalidated teamId

## State

- All changes committed. Ready for PR / format / check-types / test.

## Done

- Audited all `"use server"` files in `apps/studio.giselles.ai`
- Added `assertWorkspaceAccess` to `fetchWorkspaceFlowTrigger` and `runWorkspaceApp` in `stage/showcase/[appId]/actions.ts`
- Replaced untrusted `teamId` param with workspace's `teamDbId` from DB in `runWorkspaceApp`
- Fixed `workspaceSaveAction` to validate against route's `workspaceId` (not client-provided `workspace.id`) and added mismatch check
- Added `fetchCurrentTeam()` + subscription ID match check to `manageBilling` in `services/teams/actions/manage-billing.ts`
- Refactored `create-and-start-task.ts` to use shared `assertWorkspaceAccess` (removed duplicated local implementation)
- Replaced `updateGiselleSession({ teamId })` with `setCurrentTeam(teamId)` in `navigateWithChangeTeam` and `leaveTeam` (`settings/account/actions.ts`), removed unused `updateGiselleSession` import
- Removed incorrect `"use server"` directives from `github-authentication.tsx` and `packages/lib/github.ts`
- Removed unused `teamId` prop from `AppDetailClient` and `RunModal`

## Now

- Run format / build-sdk / check-types / test
- Create PR

## Next

- N/A — all identified issues addressed

## Open questions (UNCONFIRMED if needed)

- None remaining. The `navigateWithChangeTeam` / `leaveTeam` session concern has been resolved by switching to `setCurrentTeam`.

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/lib/create-and-start-task.ts`
- `apps/studio.giselles.ai/app/(main)/settings/account/actions.ts`
- `apps/studio.giselles.ai/app/(main)/settings/account/github-authentication.tsx`
- `apps/studio.giselles.ai/app/(main)/stage/showcase/[appId]/actions.ts`
- `apps/studio.giselles.ai/app/(main)/stage/showcase/[appId]/app-detail-client.tsx`
- `apps/studio.giselles.ai/app/(main)/stage/showcase/[appId]/components/run-modal.tsx`
- `apps/studio.giselles.ai/app/(main)/stage/showcase/[appId]/page.tsx`
- `apps/studio.giselles.ai/app/workspaces/[workspaceId]/page.tsx`
- `apps/studio.giselles.ai/packages/lib/github.ts`
- `apps/studio.giselles.ai/services/teams/actions/manage-billing.ts`
