# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Implement Issue #5287 P1 re-plan scope only for settings/account and settings/team.
- Reduce trust in client input for leave-team flow and close open-redirect risk.
- Keep current UX (team list actions) while hardening server-side checks.

## Goal (incl. success criteria)

- `navigateWithChangeTeam` validates return path via `isValidReturnUrl`.
- `leaveTeam` accepts only `rawTeamId` and determines current user on server.
- `deleteTeamMember` checks last-admin protection from DB role, not form input.
- Call sites are aligned and no new lints are introduced in changed files.

## Constraints/Assumptions

- Keep scope to P1 re-plan items; do not include task-related fixes.
- Preserve existing behavior for valid in-app navigation and leave-team action.
- Keep compatibility for existing `deleteTeamMember` callers.

## Key decisions

- Reused existing `isValidReturnUrl` from auth lib for path validation.
- Fallback redirect path on invalid input is `/settings/account`.
- `deleteTeamMember` now resolves target membership in current team and uses DB role for admin checks.

## State

- Branch name: `fix/p1-settings-actions`.
- P1 scoped code changes are implemented in account/team settings actions and account UI call site.

## Done

- Updated `apps/studio.giselles.ai/app/(main)/settings/account/actions.ts`.
- Updated `apps/studio.giselles.ai/app/(main)/settings/team/actions.ts`.
- Updated `apps/studio.giselles.ai/app/(main)/settings/account/user-teams.tsx`.
- Updated `apps/studio.giselles.ai/app/(main)/settings/account/page.tsx`.
- Simplified `deleteTeamMember` in `apps/studio.giselles.ai/app/(main)/settings/team/actions.ts` by replacing `getUser` + user-mapping join with `getCurrentUser`.
- Removed unused `role` FormData field from `deleteTeamMember` call in `apps/studio.giselles.ai/app/(main)/settings/team/team-members-list-item.tsx`.
- Verified no lint issues for changed files via IDE diagnostics.

## Now

- Addressed Copilot PR review feedback: fixed step numbering (1-7) and removed unused `userDbId` from `targetMembership` columns in `deleteTeamMember`.

## Next

- Manually verify team switching ignores external URLs.
- Manually verify leave-team flow still works from account team list.
- Manually verify last-admin removal protection cannot be bypassed by tampered form values.

## Open questions (UNCONFIRMED if needed)

- Should `deleteTeamMember` stop requiring `role` in FormData entirely in a follow-up cleanup?

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/settings/account/actions.ts`
- `apps/studio.giselles.ai/app/(main)/settings/team/actions.ts`
- `apps/studio.giselles.ai/app/(main)/settings/account/user-teams.tsx`
- `apps/studio.giselles.ai/app/(main)/settings/account/page.tsx`
- `git branch -m fix/p1-settings-actions`
