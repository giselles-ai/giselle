# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Ensure SDK error handling preserves response body text when JSON parsing fails.

## Goal (incl. success criteria)

- Verify the response body can be read after json parsing failure and fix SDK so
  ApiError.responseText includes actual response content for non-JSON bodies.

## Constraints/Assumptions

- Follow AGENTS.md and naming guide conventions.
- Keep changes minimal and obvious.

## Key decisions

- Read response body as text before attempting JSON.parse.

## State

- New task; SDK error handling needs review in packages/sdk/src/sdk.ts.

## Done

- Read CONTINUITY.md and initialized per-branch ledger.
- Updated SDK to parse JSON from response text before decoding.
- Added a test covering responseText preservation on JSON parse failure.

## Now

- Run formatting, build, typecheck, tidy, tests, and lints.
- Commit and push changes.

## Next

- Address any failures from format/build/test/lint.

## Open questions (UNCONFIRMED if needed)

- Should error handling include parse errors in ApiError details?

## Working set (files/ids/commands)

- packages/sdk/src/sdk.test.ts
- packages/sdk/src/sdk.ts
