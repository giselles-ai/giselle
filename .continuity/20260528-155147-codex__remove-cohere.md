# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Remove Cohere and follow up on PR #2930 review comments.
- Data-care cleanup for persisted profile-4 records will be handled separately.

## Goal (incl. success criteria)

- PR #2930 review feedback is checked, actionable code/ledger wording comments are addressed, and data-care feedback is acknowledged separately in English.

## Constraints/Assumptions

- Keep this PR focused on code removal and review-comment fixes.
- Do not implement persisted-data cleanup in this PR.

## Key decisions

- Treat the persisted profile-4 migration concern as separate data-care work per user instruction.
- Fix reviewer comments where the test names no longer match the updated assertions.
- Scope the continuity text-sweep claim so audit notes do not contradict it.

## State

- Review fixes complete.
- Validation passed: `pnpm format`, `pnpm -F @giselles-ai/rag test`.

## Done

- Inspected PR #2930 comments and unresolved review threads.
- Updated RAG embedder test descriptions to match assertions.
- Scoped the continuity text-sweep claim.
- Replied in English that persisted profile-4 data-care work will be handled separately.

## Now

- Ready to commit and push review fixes.

## Next

- Monitor PR #2930 for any follow-up review feedback.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `packages/rag/src/embedder/profiles.test.ts`
- `.continuity/20260127-120000-main.md`
- `.continuity/20260528-155147-codex__remove-cohere.md`
- PR #2930 review threads


## Current request
Review code changes against main merge base 3a9fffe436fb9888eb57c3787840a7802f2bceca.
