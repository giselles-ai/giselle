# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix TypeError when executing multiple SQL statements like `SELECT 1; SELECT 2;` in Data Query node

## Goal (incl. success criteria)

- Data Query node handles multiple SQL statements without crashing
- Last statement's result is returned when multiple statements are executed

## Constraints/Assumptions

- PostgreSQL `pg` library returns `QueryResult[]` (array) for multiple statements
- Parameterized queries do NOT support multiple statements (throws "cannot insert multiple commands into a prepared statement")
- This feature is for analytical queries passed to downstream Text Gen nodes
- Complex queries (SET, CREATE TEMP TABLE, etc.) are not expected

## Key decisions

- Return last statement's result (matches `psql -c` behavior)
- Discussed alternatives:
  1. Concatenate rows - rejected (mixing different table schemas causes confusion)
  2. Last result only - **approved**
  3. Error on multiple statements - rejected (pg library supports it)

## State

- PR created: https://github.com/giselles-ai/giselle/pull/2688

## Done

- Fixed `execute-data-query.ts` to handle array results from multi-statement queries
- Ran format, build-sdk, check-types, tidy, test - all passed
- Created branch `fix/data-query-multiple-statements`
- Created PR

## Now

- N/A (complete)

## Next

- N/A (complete)

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `packages/giselle/src/operations/execute-data-query.ts` (modified)
