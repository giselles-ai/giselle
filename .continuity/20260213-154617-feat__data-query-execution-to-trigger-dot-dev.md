# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Move data query execution to trigger.dev (async offloading).
- Fix bug where both onFailed and onCompleted callbacks fire for failed data query generations.
- Keep internal-api layer minimal: only access control, no defensive paths for unused scenarios.

## Goal (incl. success criteria)

- Data query execution dispatched to trigger.dev via `startDataQueryExecution`.
- `run-task.ts` correctly calls only one of `onCompleted` / `onFailed` per step.
- `generation-runner.tsx` polls for terminal status after dispatching.
- Internal-api `startDataQueryExecution` handles only the new-generation path (YAGNI).

## Constraints/Assumptions

- React client always sends new (not-yet-persisted) generations to `startDataQueryExecution`.
- Existing generation path can be added later if needed (trivial).

## Key decisions

- Replaced `executeDataQuery` with `startDataQueryExecution` across giselle package, HTTP router, React client, and internal-api.
- Removed `isCancelledGeneration` from failure check in `generation-runner.tsx` (data queries don't support cancellation yet).
- Removed existing-generation path from internal-api `startDataQueryExecution` (YAGNI; "Less is more").
- `run-task.ts` directly calls `executeDataQuery` for `dataQuery` steps (no nested Trigger.dev job dispatch; the task already runs on Trigger.dev).
- Removed all `isCallbackHandled` logic from `run-task.ts` (reverted to pre-branch behavior).
- Widened `executeDataQuery` generation type to `QueuedGeneration | RunningGeneration` so both `run-task.ts` (Queued) and `executeDataQueryJob` (Running) can call it.

## State

- All code changes applied for the revised plan.

## Done

- Replaced `executeDataQuery` with `startDataQueryExecution` in React client, HTTP router, internal-api.
- Added polling in `generation-runner.tsx`.
- Removed unused `isNoSuchKeyError` helper and existing-generation path from `triggers.ts`.
- Reverted `run-task.ts` `dataQuery` case to direct `executeDataQuery` call.
- Removed `isCallbackHandled` flag and guard from `run-task.ts`.
- Widened `generation` type in `execute-data-query.ts` and `giselle.ts` to `QueuedGeneration | RunningGeneration`.

## Now

- Changes complete. Ready for quality checks.

## Next

- Run quality checks (`pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, `pnpm test`).

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `packages/giselle/src/tasks/run-task.ts`
- `packages/giselle/src/operations/start-data-query-execution.ts`
- `packages/giselle/src/operations/execute-data-query.ts`
- `packages/giselle/src/giselle.ts`
- `packages/giselle/src/types/context.ts`
- `packages/http/src/router.ts`
- `packages/react/src/generations/generation-runner.tsx`
- `packages/react/src/giselle-client.ts`
- `apps/studio.giselles.ai/app/giselle.ts`
- `apps/studio.giselles.ai/lib/internal-api/triggers.ts`
- `apps/studio.giselles.ai/lib/internal-api/create-giselle-client.ts`
- `apps/studio.giselles.ai/trigger/execute-data-query-job.ts`
