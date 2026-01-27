# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Ensure internal secrets APIs enforce workspace authorization.

## Goal (incl. success criteria)

- Verify `addSecret` checks workspace access and add `assertWorkspaceAccess` if missing.

## Constraints/Assumptions

- Changes are in Server Actions under `apps/studio.giselles.ai/lib/internal-api`.
- Keep fix minimal and consistent with other secrets endpoints.

## Key decisions

- Align `addSecret` with `deleteSecret`/`getWorkspaceSecrets` by asserting access.

## State

- Fix committed and pushed.

## Done

- Added `assertWorkspaceAccess` before `giselle.addSecret` when workspaceId is set.
- Checked lints for `secrets.ts`.
- Committed and pushed changes to `secure-internal-api-secrets`.

## Now

- Await review/next request.

## Next

- None.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/lib/internal-api/secrets.ts`

