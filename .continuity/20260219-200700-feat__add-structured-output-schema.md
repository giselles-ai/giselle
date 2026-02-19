# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add structured output schema support to the protocol layer
- Use discriminated union pattern to make illegal states (e.g., `outputFormat: "text"` with a `structuredOutputSchema`) unrepresentable
- Follow existing codebase patterns (nested discriminated union as field value, not flat intersection)

## Goal (incl. success criteria)

- `OutputConfiguration` discriminated union in `structured-output.ts` ensures `structuredOutputSchema` only exists when `outputFormat: "json"`
- Field name `outputConfiguration` (not `outputFormat`) avoids `x.x` redundancy, matching existing patterns like `auth.type`, `state.status`
- All consumers updated, format/build/types/tidy/tests pass

## Constraints/Assumptions

- Follow existing discriminated union pattern: nested as field value, field name differs from discriminator key
- Keep `OutputConfiguration` in `structured-output.ts` (root-level shared schema, consistent with `connection.ts` pattern)

## Key decisions

- Renamed `OutputFormat` → `OutputConfiguration` (schema + type export)
- Field name: `outputConfiguration` (avoids `outputFormat.outputFormat` redundancy)
- Nested approach (not flat `z.intersection`/`extend`), consistent with all other discriminated unions in the codebase

## State

- All changes complete, all quality checks pass

## Done

- Defined `OutputConfiguration` discriminated union in `structured-output.ts`
- Updated `text-generation.ts` and `content-generation.ts` to use `outputConfiguration: OutputConfiguration`
- Updated `node-conversion.ts` to pass `outputConfiguration` as a single object (no manual spread)
- Updated `node-factories.ts` create functions
- Updated all test fixtures and assertions
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
- `packages/node-registry/src/node-conversion.ts`
- `packages/node-registry/src/node-factories.ts`
- `packages/node-registry/src/node-conversion.test.ts`
- `packages/node-registry/src/__fixtures__/node-conversion/nodes.ts`
- `packages/react/src/workspace/utils/is-supported-connection.test.ts`
