# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Refactor the public Apps Runs API to be a thin facade over `apps/studio.giselles.ai/app/giselle.ts` (primitive giselle APIs), and move response shaping/formatting to `@giselles-ai/sdk` instead of ad-hoc server response types.

## Goal (incl. success criteria)

- Studio `/api/apps/{appId}/...` routes return primitive `@giselles-ai/protocol` objects (e.g., `task` + optional `generations`) without bespoke “SDK-friendly” shaping.
- `@giselles-ai/sdk` accepts the primitive response and produces the existing SDK result shape (steps/outputs), keeping backwards compatibility with the old server response.
- SDK tests and typechecks pass.

## Constraints/Assumptions

- Keep implementation minimal and obvious (no new dependencies unless necessary).
- Do not change git branch/commit/push from the agent environment.
- Prefer not to introduce breaking changes in the public API; tolerate both old and new response shapes in the SDK.

## Key decisions

- Change `GET /api/apps/{appId}/tasks/{taskId}?includeGenerations=1` to return `{ task, generations }`.
- Keep `POST /api/apps/{appId}/run` response as `{ taskId }` (already primitive enough).
- Implement the “steps/outputs” shaping logic in `packages/sdk`, based on `task.sequences`, `generations`, and `task.nodeIdsConnectedToEnd`.

## State

- Studio Tasks route now returns a primitive response (`{ task, generations }`) when `includeGenerations=1`.
- SDK now computes `steps/outputs` from primitive `task` + `generations`, while still accepting the legacy “already-shaped” server response.

## Done

- Updated `GET /api/apps/{appId}/tasks/{taskId}?includeGenerations=1` to return `{ task, generations }`.
- Implemented SDK-side response transformation and kept backwards compatibility.
- Updated SDK tests to cover the primitive response transformation path.
- Verified `pnpm -F @giselles-ai/sdk check-types` and `pnpm -F @giselles-ai/sdk test` pass.

## Now

- Validate Studio route file stays lint/format clean (Biome) and ensure no other callers relied on the old shaped response.

## Next

- Consider adding a small protocol/schema note (doc) that `includeGenerations=1` returns primitives and SDK shapes the friendly output.

## Open questions (UNCONFIRMED if needed)

- Should the primitive response include `generations` as an array or as a `{ [id]: generation }` map? (Leaning array for JSON friendliness.)

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/api/apps/[appId]/tasks/[taskId]/route.ts`
- `packages/sdk/src/sdk.ts`
- `packages/sdk/src/sdk.test.ts`

