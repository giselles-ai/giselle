# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix deleteDataStore to prevent orphaned resources when deletion fails
- Prioritize deleting secret first (encrypted credentials) to avoid orphaning sensitive data
- Accept that DataStore (metadata only) may be orphaned as a trade-off
- Make getDataStore and deleteDataStore idempotent for retry support

## Goal (incl. success criteria)

- When deleteDataStore is called, delete in order: secret → dataStore → DB
- If deletion fails partway, user can retry and complete the deletion
- Secret (credentials) should never be orphaned; DataStore (metadata) orphan is acceptable

## Constraints/Assumptions

- S3-compatible storage (Supabase) has no transactions
- Cannot atomically delete multiple objects
- deleteSecret already handles non-existent case gracefully (returns without error)
- Failure probability of deleteDataStore after deleteSecret succeeds is very low (~0.001%)

## Key decisions

- Delete order: secret → dataStore → DB (security-first approach)
- Changed getDataStore to return undefined instead of throwing when not found
- Changed deleteDataStore to return undefined instead of throwing when not found
- Added null checks in execution contexts (execute-data-query.ts, use-generation-executor.ts)
- Accept temporary broken state where dataStore exists but secret is deleted (user can retry)

## State

- Implementation complete
- All verification passed: format, build-sdk, check-types, test, tidy

## Done

- Modified `packages/giselle/src/data-stores/get-data-store.ts`: return undefined when not found
- Modified `packages/giselle/src/data-stores/delete-data-store.ts`: return undefined when not found
- Modified `packages/giselle/src/operations/execute-data-query.ts`: added null check with error
- Modified `packages/giselle/src/generations/internal/use-generation-executor.ts`: added null check with error
- Modified `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts`: reordered deletion to secret → dataStore → DB
- Modified `packages/http/src/router.ts`: added 404 response for getDataStore and deleteDataStore when not found

## Now

- N/A (complete)

## Next

- N/A (complete)

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `packages/giselle/src/data-stores/get-data-store.ts` (modified)
- `packages/giselle/src/data-stores/delete-data-store.ts` (modified)
- `packages/giselle/src/operations/execute-data-query.ts` (modified)
- `packages/giselle/src/generations/internal/use-generation-executor.ts` (modified)
- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts` (modified)
- `packages/http/src/router.ts` (modified)
