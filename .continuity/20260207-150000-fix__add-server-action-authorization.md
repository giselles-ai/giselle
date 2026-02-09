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

## State

- Authorization audit complete for all Server Action files outside `internal-api`

## Done

- Audited all `"use server"` files in `apps/studio.giselles.ai`
- Added `assertWorkspaceAccess` to `fetchWorkspaceFlowTrigger` and `runWorkspaceApp` in `stage/showcase/[appId]/actions.ts`
- Replaced untrusted `teamId` param with workspace's `teamDbId` from DB in `runWorkspaceApp`
- Fixed `workspaceSaveAction` to validate against route's `workspaceId` (not client-provided `workspace.id`) and added mismatch check
- Added `fetchCurrentTeam()` + subscription ID match check to `manageBilling` in `services/teams/actions/manage-billing.ts`

## Now

- Run format / build-sdk / check-types / test
- Update ledger

## Next

- Commit changes
- Consider whether `navigateWithChangeTeam` in `settings/account/actions.ts` needs tightening (currently safe due to `fetchCurrentTeam()` membership validation, but sets arbitrary teamId in session)

## Open questions (UNCONFIRMED if needed)

- `navigateWithChangeTeam` in `settings/account/actions.ts` directly calls `updateGiselleSession({ teamId })` without membership check. While `fetchCurrentTeam()` handles the fallback, should we use `setCurrentTeam` for consistency?

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/stage/showcase/[appId]/actions.ts`
- `apps/studio.giselles.ai/services/teams/actions/manage-billing.ts`
- `apps/studio.giselles.ai/app/workspaces/[workspaceId]/page.tsx` (already fixed in prior session)
- `apps/studio.giselles.ai/lib/internal-api/generations.ts` (already fixed in prior session)
