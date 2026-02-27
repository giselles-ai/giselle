# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add structured output support to the public task API (`GET /api/apps/:appId/tasks/:taskId`)
- Use a discriminated union (`outputFormat: "passthrough" | "object"`) instead of optional fields
- Keep backward compatibility for existing consumers (passthrough is the default)

## Goal (incl. success criteria)

- API returns `outputType` field in the task result
- `passthrough`: includes `outputs` (existing behavior)
- `object`: includes `output` field with transformed JSON (no `outputs` duplication)
- `buildObject` logic lives in engine layer and is used by the route
- SDK parses the new response shape

## Constraints/Assumptions

- Keep backward compatibility: tasks without `endNodeOutput` default to `{ format: "passthrough" }`
- Follow discriminated union pattern (like Anthropic API) rather than optional fields
- `buildObject` implementation is separate from this route change
- Flat response structure (no nesting under `output` key) to preserve backward compatibility

## Key decisions

- Use discriminated union on `outputType` instead of optional field
- When `format === "object"`, do NOT include `outputs` (avoid redundancy; raw data available in `steps`)
- Investigated OpenAI, Anthropic, Vercel AI SDK patterns — none use optional fields for this
- Field name `output` (not `structuredOutput`) to match `outputType: "object"` and Vercel AI SDK naming
- Keep `outputType` (not `format`) for clarity and extensibility at the top level
- Flat structure (not nested under `output`) to preserve backward compatibility with existing `task.outputs`
- Exhaustive switch with `never` check on `endNodeOutput` (not `.format` due to Zod v4 built-type limitation)
- Exported `EndOutputSchema` from `end.ts` (was file-local `Output`) for reuse in Task schema
- Use `Record<NodeId, CompletedGeneration>` (branded type) for `generationsByNodeId` for type safety

## State

- `buildObject` is implemented in `packages/giselle/src/tasks/build-object.ts` and wired into Studio task API route.
- Object output now resolves from completed generations by node ID (`generationsByNodeId`).
- SDK update reverted from this branch; will be a separate follow-up PR.
- Monorepo checks:
  - `pnpm format`: pass
  - `pnpm build-sdk`: pass
  - `pnpm test`: pass (engine: 11 build-object tests, all others green)
  - `pnpm check-types`: pass

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
  - JSON parsing + `source.path` navigation; best-effort mode (returns `undefined` per field instead of throwing)
- Added `packages/giselle/src/tasks/build-object.test.ts` (11 tests: 7 valid, 4 invalid).
- Refined `build-object.test.ts` to avoid helper abstractions (`createSchema`, `generatedTextOutput`) and keep test fixtures explicit/inline per case.
- Organized tests into `describe("valid")` and `describe("invalid")` blocks.
- Exported `buildObject` from `packages/giselle/src/tasks/index.ts` and `packages/giselle/src/index.ts` (named export only).
- Replaced route-local `buildObject` mock with engine implementation in `apps/studio.giselles.ai/app/api/apps/[appId]/tasks/[taskId]/route.ts`.
- Added route-side `generationsByNodeId` construction using `Record<NodeId, CompletedGeneration>` (branded type).
- Simplified route object branch to call `buildObject` directly (removed route-side structured-output error classification/catch fallback).
- Renamed internal variables for consistency (`directMapping` → `mapping`, `mappingAtPath` → `mapping`, `mappingAtItemsPath` → `itemsMapping`).
- Fixed phantom empty object bug: `buildValueFromSubSchema` `"object"` case now returns `undefined` when no child properties are resolved (previously returned `{}`).
- Added test: "omits nested object when no child properties can be resolved" (12 tests total).

## Now

- API route and `buildObject` engine complete. SDK update deferred to a follow-up PR.
- Discriminant field: `outputType` (`"passthrough"` | `"object"`), result field: `output` (object) or `outputs` (passthrough).
- All quality checks pass: format, build-sdk, check-types, test (12 build-object tests).

## Next

- E2E testing with curl against a real workspace + published App with structured output End node.
- SDK update (`packages/sdk/src/sdk.ts`) to parse `outputType: "object"` response — separate PR after this one merges.
- Decide follow-up for array item sub-property mapping (`["...","items","name"]`) currently treated as out-of-scope limitation (UI still allows selecting it).

## Open questions (UNCONFIRMED if needed)

- None currently

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/api/apps/[appId]/tasks/[taskId]/route.ts` (modified)
- `packages/giselle/src/tasks/build-object.ts` (added)
- `packages/giselle/src/tasks/build-object.test.ts` (added)
- `packages/giselle/src/tasks/index.ts` (modified)
- `packages/giselle/src/index.ts` (modified)
- `packages/sdk/src/sdk.ts` (follow-up PR)
- `packages/sdk/src/sdk.test.ts` (follow-up PR)
