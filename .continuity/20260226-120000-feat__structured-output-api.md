# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add structured output support to the public task API (`GET /api/apps/:appId/tasks/:taskId`)
- Use a discriminated union (`outputFormat: "passthrough" | "object"`) instead of optional fields
- Keep backward compatibility for existing consumers (passthrough is the default)

## Goal (incl. success criteria)

- API returns `outputFormat` field in the task result
- `passthrough`: includes `outputs` (existing behavior)
- `object`: includes `object` field with transformed JSON (no `outputs` duplication)
- `buildObject` logic lives in engine layer (mock for now in route)
- SDK parses the new response shape

## Constraints/Assumptions

- Keep backward compatibility: tasks without `endNodeOutput` default to `{ format: "passthrough" }`
- Follow discriminated union pattern (like Anthropic API) rather than optional fields
- `buildObject` implementation is separate from this route change
- Flat response structure (no nesting under `output` key) to preserve backward compatibility

## Key decisions

- Use discriminated union on `outputFormat` instead of optional field
- When `format === "object"`, do NOT include `outputs` (avoid redundancy; raw data available in `steps`)
- Investigated OpenAI, Anthropic, Vercel AI SDK patterns — none use optional fields for this
- Field name `object` (not `structuredOutput`) to match `outputFormat: "object"` and Vercel AI SDK naming
- Keep `outputFormat` (not `format`) for clarity and extensibility at the top level
- Flat structure (not nested under `output`) to preserve backward compatibility with existing `task.outputs`
- Exhaustive switch with `never` check on `endNodeOutput` (not `.format` due to Zod v4 built-type limitation)
- Exported `EndOutputSchema` from `end.ts` (was file-local `Output`) for reuse in Task schema

## State

- All quality checks pass: format, build-sdk, check-types (31/31), tidy, test

## Done

- Analyzed API design patterns across OpenAI, Anthropic, Vercel AI SDK
- Decided on discriminated union approach
- Exported `EndOutputSchema` from `packages/protocol/src/node/operations/end.ts`
- Added `endNodeOutput` field to Task schema (`packages/protocol/src/task/task.ts`) with `.default({ format: "passthrough" })`
- Captured End Node `content.output` in `create-task.ts` and stored as `endNodeOutput` on Task
- Implemented discriminated union `ApiTaskResult` type in route.ts
- Implemented exhaustive switch on `endNodeOutput.format` in route.ts
- Added `buildObject` mock function in route.ts
- Fixed test fixtures (`patch-object.test.ts`, `task-execution-utils.test.ts`) to include `endNodeOutput`
- All quality checks pass: `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, `pnpm test`

## Now

- API route implementation complete (with mock `buildObject`)

## Next

- Implement real `buildObject` in `packages/giselle/src/tasks/build-object.ts`
- Add unit tests for `buildObject`
- Update SDK (`packages/sdk/src/sdk.ts`) to parse the new `outputFormat` / `object` response fields
- Update plan file to reflect completed items

## Open questions (UNCONFIRMED if needed)

- None currently

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/api/apps/[appId]/tasks/[taskId]/route.ts` (modified)
- `packages/protocol/src/task/task.ts` (modified)
- `packages/protocol/src/node/operations/end.ts` (modified)
- `packages/giselle/src/tasks/create-task.ts` (modified)
- `packages/giselle/src/tasks/object/patch-object.test.ts` (modified)
- `packages/giselle/src/tasks/shared/task-execution-utils.test.ts` (modified)
- `packages/sdk/src/sdk.ts` (pending changes)
