# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix createDataStore to prevent orphaned secrets and data stores when creation fails
- Extract Giselle operations into a helper function with internal rollback
- Add rollback for DB insert failure in main function

## Goal (incl. success criteria)

- When createDataStore is called, if any step fails, previously created resources are cleaned up
- Secret is never orphaned; DataStore orphan is acceptable only if rollback itself fails

## Constraints/Assumptions

- S3-compatible storage (Supabase) has no transactions
- Cannot atomically create multiple objects
- deleteSecret and deleteDataStore already handle non-existent case gracefully

## Key decisions

- Created helper function `createGiselleDataStoreWithSecret` that:
  - Creates secret first
  - Creates data store with reference to secret
  - If createDataStore fails, deletes secret before re-throwing
- Updated `createDataStore` to:
  - Fetch team first (sequentially) to avoid orphaned resources if fetchCurrentTeam fails
  - Use the helper function
  - If db.insert fails, delete both secret and data store before re-throwing

## State

- Implementation complete
- All verification passed: format, build-sdk, check-types, test, tidy

## Done

- Added `createGiselleDataStoreWithSecret` helper function with internal rollback
- Updated `createDataStore` to use helper and add DB failure rollback

## Now

- N/A (complete)

## Next

- N/A (complete)

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts` (modified)
