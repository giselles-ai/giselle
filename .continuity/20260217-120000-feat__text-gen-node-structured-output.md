# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add a feature flag to gate the structured output (JSON output format) setting in text generation nodes.

## Goal (incl. success criteria)

- Gate the structured output UI (output format selector + JSON schema textarea) behind a `structuredOutput` feature flag so it is not visible in production until explicitly enabled.

## Constraints/Assumptions

- Follow established feature flag pattern (flags.ts → context.ts → provider.tsx → data-loader.ts → component).
- The backend logic in `generate-content.ts` does not need gating because `outputFormat` defaults to `"text"` and the JSON path is only reachable when `outputFormat === "json"` and `jsonSchema` is set (which requires the UI).

## Key decisions

- Flag key: `structured-output`, env var: `STRUCTURED_OUTPUT_FLAG`, Edge Config key: `flag__structured-output`.
- UI gating only: the output format selector and JSON schema textarea are hidden when the flag is off; the Tools section remains always visible.

## State

- Feature flag wired; structured output (text + content nodes) implemented; JSON display formatted via code fences; parity between TextGeneration and ContentGeneration for outputFormat.
- PR #2737 review feedback addressed.

## Done

- Added `structuredOutputFlag` to `apps/studio.giselles.ai/flags.ts`.
- Added `structuredOutput` to `FeatureFlagContextValue` and `WorkspaceProvider`; wired in data-loader; gated output format UI in `advanced-options.tsx`.
- Protocol: `outputFormat` and `jsonSchema` on `TextGenerationContent`; same fields added to `ContentGenerationContent`.
- `generate-content.ts`: `experimental_output` for text path and V2 (content) path when `outputFormat === "json"` and valid `jsonSchema`.
- `GenerationView`: when operation node is Text or Content and `outputFormat === "json"` **and** `jsonSchema` is truthy, wrap text in ` ```json ` fences so Streamdown renders a code block; copy and downstream still use raw JSON.
- Fixed display/generation mismatch: display now checks both `outputFormat === "json"` and `!!jsonSchema` to match generation logic, preventing misleading JSON fences when schema is empty.
- Node-registry: conversion and factories set `outputFormat` (and `jsonSchema` where applicable); fixtures and tests updated.
- React test: `createContentGenerationNode` and `createTextGenerationNode` include `outputFormat: "text"`.
- Verified: `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy` pass.
- **PR review fixes (2026-02-18):**
  - `generation-view.tsx`: Deduplicated `isJsonOutputFormat` branches; added `JSON.parse` validation so JSON fences are only applied when schema is actually valid; refactored from IIFE to plain `let` + if statements.
  - `generate-content.ts`: Extracted `buildOutputOption` helper to eliminate V1/V2 duplication; included caught error in `logger.warn` for better diagnosability.
  - `text-generation-node-properties-panel-v2/advanced-options.tsx`: Added structured output UI (output format selector + JSON schema textarea) gated by `structuredOutput` feature flag, matching V1 parity.
- **Strict jsonSchema typing (2026-02-18):**
  - Protocol: Changed `jsonSchema` from `z.string().optional()` to `z.object({ type, properties, additionalProperties, required, title }).optional()` in both `TextGenerationContent` and `ContentGenerationContent`.
  - UI (both `advanced-options.tsx`): `defaultJsonSchema` is now an object literal with `title: "output"`; textarea uses local string state with `onBlur` validation to convert back to a typed object.
  - `buildOutputOption`: Removed `JSON.parse()` and logger/nodeId params since schema is already validated at protocol level.
  - `generation-view.tsx`: Simplified `isJsonOutputFormat` to a plain boolean expression (no more `JSON.parse` try/catch).
- **UI onBlur validation via protocol schema (2026-02-18):**
  - Both `advanced-options.tsx`: Replaced manual field-by-field if-check with `ContentGenerationContent.shape.jsonSchema.safeParse()` / `TextGenerationContent.shape.jsonSchema.safeParse()` so validation is delegated to the protocol Zod schema.

## Now

- Completed: onBlur validation refactored to use protocol schema.

## Next

- Set `STRUCTURED_OUTPUT_FLAG=true` in `.env.local` for local testing.
- Optionally batch-summarize into `CONTINUITY.md` when batching.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/flags.ts`
- `packages/react/src/feature-flags/context.ts`, `provider.tsx`, `is-supported-connection.test.ts`
- `apps/studio.giselles.ai/app/workspaces/[workspaceId]/data-loader.ts`
- `packages/protocol/src/node/operations/text-generation.ts`, `content-generation.ts`
- `packages/giselle/src/generations/generate-content.ts`
- `packages/node-registry/src/node-conversion.ts`, `node-factories.ts`, `__fixtures__/node-conversion/nodes.ts`, `node-conversion.test.ts`
- `internal-packages/workflow-designer-ui/src/ui/generation-view.tsx`
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/advanced-options.tsx`
