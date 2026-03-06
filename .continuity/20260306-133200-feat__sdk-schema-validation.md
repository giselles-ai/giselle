# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add Standard Schema v1 validation support to SDK `runAndWait` method.
- Update App Entry dialog to show validation library-specific sample code.
- Address all PR review feedback from automated reviewers.

## Goal (incl. success criteria)

- Standard Schema v1 validation on `runAndWait` with typed output.
- Code generators for Zod, Valibot, ArkType, Joi, Yup, Effect in App Entry dialog.
- All review comments from Codex, Copilot, and CodeRabbit addressed.

## Constraints/Assumptions

- Only include validation libraries confirmed to support Standard Schema v1.
- Follow codebase conventions (escaping in code gen).

## Key decisions

- **Keep Yup and Joi** — both are confirmed Standard Schema v1 implementations per [standardschema.dev](https://standardschema.dev/schema#what-schema-libraries-implement-the-spec) (Yup v1.7.0+, Joi v18.0.0+).
- **No `.strict()` on generated object schemas** — AI model output validation benefits from Zod's default strip behavior (forgiving). `additionalProperties: false` in JSON Schema already instructs the model.
- **No runtime Standard Schema v1 guard** — `schema` is typed as `StandardSchemaV1<unknown, T>`, TypeScript enforces the contract at compile time. YAGNI for JS callers.
- **No Symbol-based branding on `SchemaValidationError`** — other SDK error classes don't have it either. Add consistently across all errors in a separate PR if needed.
- **No runtime guard on `onValueChange` cast** — Select options are hardcoded in the same component.
- Schema validation only runs on completed tasks (not failed/cancelled).
- Added `formatPropertyKey`, `formatStringLiteral`, `formatArkTypeLiteral` helpers for safe code generation.
- Sample code: `task.status === "completed"` guard added to mirror SDK behavior.
- Sample code: schema declaration moved below client instantiation for better readability.

## State

- All review feedback addressed via PR comment replies and code changes.

## Done

- P1: Skip schema validation when task is not completed (failed/cancelled).
- Fix JSDoc "Zod v4" to "Zod".
- Escape property keys and enum literals in all code generators.
- Add `task.status === "completed"` guard in sample code.
- Move schema declaration below client instantiation in sample code.
- Add 4 unit tests for schema validation behavior.
- Reply to all PR review comments with rationale.

## Now

- Ready for push and human reviewer approval.

## Next

- None; review fixes complete.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `packages/sdk/src/sdk.ts`
- `packages/sdk/src/errors.ts`
- `packages/sdk/src/sdk.test.ts`
- `internal-packages/workflow-designer-ui/src/app/app-entry-input-dialog/dialog.tsx`
- `internal-packages/workflow-designer-ui/src/app/app-entry-input-dialog/generate-sample-code.ts`
