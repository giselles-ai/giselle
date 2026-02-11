# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix Issue #5288 P0 authorization gaps with minimal behavior impact.
- Prevent unauthorized access to generated images and subscription success side effects.

## Goal (incl. success criteria)

- Require workspace/team membership before serving `generated-images`.
- Require authenticated user for `/subscriptions/success` and apply `teamId` session update only when the user belongs to that team.

## Constraints/Assumptions

- Keep changes minimal and reuse existing auth helpers (`getCurrentUser`, `assertWorkspaceAccess`, `isMemberOfTeam`).
- Favor safe fallback behavior on validation failures (`/settings/team` redirect, no session update).

## Key decisions

- `generated-images` now resolves `generationId` -> generation -> workspace and enforces `assertWorkspaceAccess` before file retrieval.
- `generated-images` returns unified `404 Not found` for invalid/non-existent/unauthorized access paths to reduce leakage.
- `/subscriptions/success` updates session only when subscription team membership is confirmed.
- Removed `subscription` from `apps/studio.giselles.ai/proxy.ts` matcher exclusions so `/subscriptions/...` is protected by proxy auth again.
- `/subscriptions/success` now relies on proxy auth, and parallelizes `getCurrentUser()` with `getTeamFromSubscription()` via `Promise.all`.

## State

- Branch created: `fix/access-control`.
- Three files updated (`generated-images` route, `subscriptions/success` route, `proxy.ts` matcher); continuity ledger tracks follow-up decisions.

## Done

- Added authorization guard to `app/api/generations/[generationId]/generated-images/[filename]/route.ts`.
- Added team-membership checks to `app/subscriptions/success/route.ts` and kept failure-safe fallback behavior.
- Updated `app/subscriptions/success/route.ts` to fetch user/team with `Promise.all`.
- Removed `subscription` from `app/proxy.ts` matcher exclusions.
- Added this branch-specific continuity ledger.
- Assessed P1 concern for `subscriptions/success` CSRF semantics: membership/auth protections were added, but the route still uses `GET` with `updateGiselleSession` side effects.

## Now

- Run lint/type checks for changed files and confirm no regressions from the added guards.

## Next

- Manually verify:
- unauthenticated `/subscriptions/success` is intercepted by proxy auth and redirected to login
- non-member user does not get session `teamId` update
- cross-team generated image access is denied

## Open questions (UNCONFIRMED if needed)

- Whether `generated-images` should distinguish `403` vs `404` for unauthorized access in future API policy (currently unified to `404`).
- Should `/subscriptions/success` be converted to a non-GET state transition (e.g., POST with explicit confirmation token) to fully close CSRF/prefetch-trigger concerns?

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/api/generations/[generationId]/generated-images/[filename]/route.ts`
- `apps/studio.giselles.ai/app/subscriptions/success/route.ts`
- `apps/studio.giselles.ai/proxy.ts`
- `.continuity/20260211-111702-fix__access-control.md`
- `git branch -m fix/access-control`
