# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add structured output support (`outputType: "object"`) to the `@giselles-ai/sdk` types and parser.
- Maintain backward compatibility with the existing `passthrough` format.
- Add tests to prevent regressions.

## Goal (incl. success criteria)

- `parseTaskResponseJson` correctly identifies and parses `outputType: "passthrough" | "object"`.
- `AppTask` type updated to a discriminated union supporting the `output` field for object responses.
- `runAndWait()` tests verify both old and new response formats.

## Constraints/Assumptions

- The HTTP server implementation maintains the `outputType` shape at `/api/apps/{appId}/tasks/{taskId}`.
- The SDK does not directly expose internal protocol types.
- Changes are scoped to `packages/sdk` only (no shared type extraction or SDK restructuring in this PR).

## Key decisions

- Keep `TaskWithStatus` for intermediate polling responses; extend final results into `PassthroughAppTask` and `ObjectAppTask` discriminated union.
- Both `outputType: "object"` and `outputType: "passthrough"` are explicitly checked; unknown values throw `"Invalid response JSON"`.
- `passthrough` responses use direct cast (`task as PassthroughAppTask`) since `outputType` is already present in the API response.
- `object` responses also use direct cast (`task as ObjectAppTask`); no spread needed.
- No `undefined` fallback for `outputType` — the SDK requires the API to always send `outputType`. This is safe because the API PR (which adds `outputType` to all responses) will be deployed first.

## State

- Branch: `feat/structured-output-for-sdk`
- SDK type definitions and parser updated. Tests already present and all passing.
- All quality checks pass: format, build-sdk, check-types, test (15 SDK tests).

## Done

- Updated `AppTask` type to discriminated union: `TaskWithStatus | PassthroughAppTask | ObjectAppTask`
- `PassthroughAppTask`: includes `outputs`, `outputType: "passthrough"`
- `ObjectAppTask`: includes `output`, `outputType: "object"`
- Updated `parseTaskResponseJson` to explicitly check `outputType` for both `"object"` and `"passthrough"`; throws on unknown values
- Tests cover: explicit passthrough with `outputType`, and object output type
- Test mocks include `outputType: "passthrough"` in server responses (matching new API behavior)

## Now

- Implementation complete. Ready for PR.

## Next

- Create PR and submit for review.

## Open questions (UNCONFIRMED if needed)

- None currently.

## Working set (files/ids/commands)

- `packages/sdk/src/sdk.ts`
- `packages/sdk/src/sdk.test.ts`
