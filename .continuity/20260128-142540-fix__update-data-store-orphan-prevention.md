# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Prevent orphaned newSecret/oldSecret in updateDataStore
- Only rollback when possible; rollback itself can fail
- Communicate partial success honestly to the user

## Goal (incl. success criteria)

- Implement rollback mechanism to prevent secret orphaning during data store update
- Notify user of partial success when rollback is not possible
- Success criteria: assuming rollback succeeds, no orphaned secrets

## Constraints/Assumptions

- True transactions across multiple independent API calls (addSecret, updateDataStore, deleteSecret) are not possible
- Rollback operations can also fail
- After oldSecret is deleted, original connection string value is lost, making full rollback impossible

## Key decisions

1. **Rollback strategy**: "Rollback when possible, communicate honestly when not"
   - If oldSecret still exists → rollback possible → do it
   - If oldSecret already deleted → rollback impossible → notify partial success

2. **On oldSecret deletion failure**: Rollback
   - oldSecret still exists (deletion failed)
   - Revert updateDataStore to oldSecretId and delete newSecret

3. **On DB update failure**: No rollback
   - oldSecret already deleted, cannot restore original value
   - Connection string is updated, data store is functional
   - Notify user: "Connection string was updated, but name update failed"

4. **Logging**: Only log rollback failures
   - Regular failures are thrown and handled by outer catch
   - Rollback failures are swallowed, so logging is necessary

## State

- Implementation complete
- format, check-types passed

## Done

- [x] Rename `replaceDataStoreSecret` → `updateDataStoreWithSecret`
- [x] Add rollback on Step 2 (updateDataStore) failure: delete newSecret
- [x] Add rollback on Step 3 (oldSecret deletion) failure: revert updateDataStore + delete newSecret
- [x] Add specific error message for partial success on DB update failure
- [x] Add comment explaining why we don't rollback on DB failure
- [x] Remove unnecessary logs (keep only rollback failure logs)

## Now

- Ready to commit

## Next

- Commit & create PR

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts`
