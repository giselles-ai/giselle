# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Refactor `resolveQuery` to extract the placeholder-to-parameter conversion logic into a pure function `parameterizeQuery`
- Make tests clearer by testing the pure function directly without mocks

## Goal (incl. success criteria)

- Extract `parameterizeQuery` pure function that converts `{{nodeId:outputId}}` keywords to SQL placeholders (`$1`, `$2`, etc.)
- Tests should be simple, mock-free, and clearly communicate what they're testing
- All existing functionality must be preserved
- Clear terminology: `replaceKeyword` for `{{...}}`, `placeholder` for `$1`

## Constraints/Assumptions

- LLM-generated content (textGeneration, contentGeneration) should NOT be parameterized (direct SQL substitution)
- User-controlled inputs (text, trigger, action, appEntry) MUST be parameterized for SQL injection prevention
- LIKE pattern limitation: `'%{{...}}%'` does not work correctly (known, not addressed in this PR)

## Key decisions

- Separated value resolution (async, I/O) from parameterization (pure, sync)
- `resolveQuery` now collects `ReplaceKeywordValue[]` and `directReplacements[]`, then calls `parameterizeQuery`
- Tests now directly test `parameterizeQuery` without needing storage, appEntryResolver, or RunningGeneration mocks
- Renamed `PlaceholderValue` → `ReplaceKeywordValue` for clearer terminology
- Changed `value` type from `unknown` to `string` for accuracy
- Consistent naming: `replaceKeyword` ({{...}}) and `placeholder` ($1)

## State

- Complete, committed

## Done

- Created `ReplaceKeywordValue` interface and `parameterizeQuery` pure function
- Refactored `resolveQuery` to use `parameterizeQuery`
- Rewrote tests to test `parameterizeQuery` directly (mock-free)
- Renamed `PlaceholderValue` → `ReplaceKeywordValue`
- Unified terminology: `replaceKeyword` for {{...}}, `placeholder` for $1
- Changed `value` type from `unknown` to `string`
- All tests pass, type-check passes, format applied
- Committed: `refactor: Extract parameterizeQuery as pure function for better testability`

## Now

- Ready for code review

## Next

- Push and create PR

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `packages/giselle/src/operations/execute-data-query.ts` - main implementation
- `packages/giselle/src/operations/execute-data-query.test.ts` - tests

