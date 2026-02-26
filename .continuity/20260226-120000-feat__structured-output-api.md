# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add structured output support to the public task API (`GET /api/apps/:appId/tasks/:taskId`)
- Use a discriminated union (`outputFormat: "passthrough" | "object"`) instead of optional fields
- Keep backward compatibility for existing consumers (passthrough is the default)

## Goal (incl. success criteria)

- API returns `outputFormat` field in the task result
- `passthrough`: includes `outputs` (existing behavior)
- `object`: includes `object` field with transformed JSON (no `outputs` duplication)
- `buildObject` logic lives in engine layer and is used by the route
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

- `buildObject` is implemented in `packages/giselle/src/tasks/build-object.ts` and wired into Studio task API route.
- Object output now resolves from completed generations by node ID (`generationsByNodeId`).
- Monorepo checks for this change:
  - `pnpm format`: pass
  - `pnpm build-sdk`: pass
  - `pnpm test`: pass (includes new `build-object.test.ts`)
  - `pnpm check-types`: fail in `studio.giselles.ai` due unrelated missing modules (`@giselles-ai/browser-tool/relay`, `@giselles-ai/sandbox-agent`)
  - `pnpm tidy`: fail with `knip --no-config-hints` (`ERROR: Invalid input`)

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
- Implemented real `buildObject` in `packages/giselle/src/tasks/build-object.ts`:
  - schema-based recursive object construction
  - mapping resolution against `generationsByNodeId`
  - output-type handling for `generated-text`, `reasoning`, `query-result`, `data-query-result`
  - JSON parsing + `source.path` navigation with explicit errors for unresolved mappings/paths
- Added `packages/giselle/src/tasks/build-object.test.ts` (8 tests).
- Refined `build-object.test.ts` to avoid helper abstractions (`createSchema`, `generatedTextOutput`) and keep test fixtures explicit/inline per case.
- Exported `buildObject` from `packages/giselle/src/tasks/index.ts` and `packages/giselle/src/index.ts` (named export only).
- Replaced route-local `buildObject` mock with engine implementation in `apps/studio.giselles.ai/app/api/apps/[appId]/tasks/[taskId]/route.ts`.
- Added route-side `generationsByNodeId` construction and 500 response guard when structured output building fails.
- Fixed polling regression for `outputFormat: "object"`: when task status is not `completed`, missing mapped generations/outputs now return `{ object: {} }` instead of 500.
- Changed `buildObject` to best-effort mode (returns `undefined` per field instead of throwing for missing mappings/generations/outputs/JSON/path failures), while keeping `never` exhaustiveness throws.
- Simplified route object branch to call `buildObject` directly (removed route-side structured-output error classification/catch fallback).

## Now

- API route implementation complete with real `buildObject` integration.
- Structured object polling no longer returns 500 for in-progress runs with incomplete mapped generations.
- Structured object response path is validated by `build-object.test.ts` (missing generation/output/path now covered as non-throw behavior).
- Structured object builder now behaves like passthrough-style best effort: unresolved mappings are omitted from `object` instead of causing API failure.

## Next

- Update SDK (`packages/sdk/src/sdk.ts`) to parse and expose the `outputFormat: "object"` shape end-to-end.
- Decide follow-up for array item sub-property mapping (`["...","items","name"]`) currently treated as out-of-scope limitation (UI still allows selecting it).

## Open questions (UNCONFIRMED if needed)

- None currently

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/api/apps/[appId]/tasks/[taskId]/route.ts` (modified)
- `packages/giselle/src/tasks/build-object.ts` (added)
- `packages/giselle/src/tasks/build-object.test.ts` (added)
- `packages/giselle/src/tasks/index.ts` (modified)
- `packages/giselle/src/index.ts` (modified)
- `packages/sdk/src/sdk.ts` (pending changes)
