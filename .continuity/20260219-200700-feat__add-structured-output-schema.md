# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add structured output schema support to the protocol layer
- Use discriminated union pattern to make illegal states unrepresentable
- Follow existing codebase patterns (nested discriminated union as field value, not flat intersection)
- Align naming with AI SDK (`Output`, `format: "text" | "object"`)

## Goal (incl. success criteria)

- `Output` discriminated union in `structured-output.ts` ensures `schema` only exists when `format: "object"`
- Field name `output` aligns with AI SDK's `output` option
- Format values `"text"` / `"object"` match AI SDK conventions for intuitive downstream mapping
- All consumers updated, format/build/types/tidy/tests pass

## Constraints/Assumptions

- Follow existing discriminated union pattern: nested as field value, field name differs from discriminator key
- Keep `Output` in `structured-output.ts` (root-level shared schema, consistent with `connection.ts` pattern)
- Avoid naming conflict with existing `Output` type in `node/base.ts` (node output port)

## Key decisions

- Renamed `OutputConfiguration` → `Output`, `StructuredOutputSchema` → `Schema`
- Field name: `output` (matches AI SDK)
- Discriminator: `format` with values `"text"` | `"object"` (matches AI SDK `Output.text()` / `Output.object()`)
- Schema field: `schema` (concise, matches AI SDK)
- Barrel export: `export { Schema } from "./structured-output"` to avoid conflict with `Output` from `node/base.ts`

## State

- All changes complete, all quality checks pass

## Done

- Defined `Output` discriminated union with `format: "text" | "object"` in `structured-output.ts`
- Updated `text-generation.ts` and `content-generation.ts` to use `output: Output`
- Updated `node-conversion.ts` to pass `output` field
- Updated `node-factories.ts` create functions
- Updated all test fixtures and assertions
- Fixed barrel export in `index.ts` to avoid `Output` naming conflict
- format, build-sdk, check-types, tidy, test all pass

## Now

- Complete

## Next

- Commit changes if requested

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `packages/protocol/src/structured-output.ts`
- `packages/protocol/src/node/operations/text-generation.ts`
- `packages/protocol/src/node/operations/content-generation.ts`
- `packages/protocol/src/index.ts`
- `packages/node-registry/src/node-conversion.ts`
- `packages/node-registry/src/node-factories.ts`
- `packages/node-registry/src/node-conversion.test.ts`
- `packages/node-registry/src/__fixtures__/node-conversion/nodes.ts`
- `packages/react/src/workspace/utils/is-supported-connection.test.ts`
