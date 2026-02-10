# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Prevent users from upgrading arbitrary teams by tampering with server action input.
- Ensure only team admins can send member invitations from server-side action logic.
- Keep `sendInvitationsAction` loading logic explicit and parallelized with `Promise.all`.
- Keep change scope minimal and consistent with existing patterns in `settings/team/actions.ts`.

## Goal (incl. success criteria)

- Team upgrade flow no longer accepts client-bound `team` object as authority.
- Team invite action rejects non-admin users on the server even if UI is bypassed.
- `sendInvitationsAction` resolves user/team/role in a single `Promise.all`.
- Touched files remain lint-clean.

## Constraints/Assumptions

- Follow existing authorization style already used by `revokeInvitationAction` and `resendInvitationAction`.
- Do not alter unrelated modified files in the working tree.
- Keep behavior stable except for the authorization hardening.

## Key decisions

- Use `upgradeCurrentTeam` directly as the server action from UI (no wrapper action file).
- Rename action file/symbol to `current`:
  - `upgrade-team.ts` -> `upgrade-current-team.ts`
  - `upgradeTeam` -> `upgradeCurrentTeam`
- `upgradeCurrentTeam` resolves the current team internally via `fetchCurrentTeam()` and builds checkout metadata from that team only.
- Add admin-role guard to `sendInvitationsAction` and return structured `failure` for unauthorized attempts.
- Use `Promise.all([getCurrentUser(), fetchCurrentTeam(), getCurrentUserRole()])` in `sendInvitationsAction`.

## State

- Branch contains targeted authorization fixes for:
  - upgrade action input trust issue
  - invitation action missing admin authorization check.
- Branch name and continuity now describe the concrete issues and fixes.

## Done

- Updated `apps/studio.giselles.ai/app/(main)/settings/team/page.tsx`:
  - replaced upgrade action binding with `upgradeCurrentTeam`.
- Added `apps/studio.giselles.ai/services/teams/actions/upgrade-current-team.ts`:
  - `"use server"` action `upgradeCurrentTeam()`
  - team resolution inside action via `fetchCurrentTeam()`.
- Deleted `apps/studio.giselles.ai/services/teams/actions/upgrade-team.ts` after symbol/file consolidation.
- Updated `apps/studio.giselles.ai/app/(main)/settings/team/actions.ts`:
  - added admin check in `sendInvitationsAction`
  - adjusted loading to `Promise.all` including `getCurrentUserRole`.
  - separated permission-check failure and non-admin failure into different return messages in `sendInvitationsAction`.
- Updated `apps/studio.giselles.ai/app/(main)/settings/team/page.tsx`:
  - pass rendered `team.id` into `UpgradeButton` and bind it into the server action call.
- Updated `apps/studio.giselles.ai/services/teams/actions/upgrade-current-team.ts`:
  - accept `expectedTeamId` and compare it with `fetchCurrentTeam().id` before creating checkout.
  - abort checkout with a clear error message when team context changed.
  - added server-side eligibility guard to reject non-Free plans before checkout creation.
- Updated `apps/studio.giselles.ai/app/(main)/ui/header/upgrade-button.tsx`:
  - include `teamId` in header upgrade context.
  - bind `upgradeCurrentTeam` with the expected team id to avoid FormData being passed as the first argument.

## Now

- Changes include stale-team guard and non-Free eligibility guard for upgrade checkout flow.
- Invitation action now returns distinct error messages for permission-check failure vs non-admin role.
- Header upgrade button now uses the same expected-team-id binding as the team settings page.

## Next

- Verify with manual scenarios:
  - admin user can send invitations
  - non-admin invite attempt is rejected server-side
  - team upgrade button still starts checkout for current team.

## Open questions (UNCONFIRMED if needed)

- Should unauthorized invite responses keep `unknown_error`, or should we add a dedicated status (e.g. `forbidden`) in `SendInvitationsResult`?
- If the expected team id mismatches current team id, should we show a dedicated user-facing UI message instead of a thrown action error?

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/settings/team/actions.ts`
- `apps/studio.giselles.ai/app/(main)/settings/team/page.tsx`
- `apps/studio.giselles.ai/services/teams/actions/upgrade-current-team.ts`
- `git branch -m fix/team-upgrade-auth-and-invite-admin-check`

