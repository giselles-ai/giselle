# `.continuity/` — Per-branch continuity ledgers

This directory contains **high-churn, per-branch** ledgers that capture recent work context (“human intent”) without causing frequent merge conflicts in `CONTINUITY.md`.

## Two-layer model

- **`CONTINUITY.md`**: a **batched snapshot** (“as of <date>”) summarizing current focus and key decisions. Low churn.
- **`.continuity/`**: the **recent working set** (what changed, why, tradeoffs, open questions, working set). High churn.

## Ledger file naming

Each ledger file name follows:

`YYYYMMDD-HHMMSS-<sanitizedBranch>.md`

Where `<sanitizedBranch>` is the git branch name with `/` replaced by `__`.

Examples:
- `20260106-095110-main.md`
- `20260106-095110-feature__api-publishing.md`

## Which file to edit (agent behavior)

- Determine current branch name: `git rev-parse --abbrev-ref HEAD`
- Sanitize branch for filenames: replace `/` with `__`
- In `.continuity/`, find files whose filename ends with `-<sanitizedBranch>.md`
  - If multiple match: choose the latest by lexicographically greatest datetime prefix
  - If none match: create a new file using `.continuity/template.md`

## What to write in ledgers

- Keep entries compact and factual (bullets).
- Record intent and rationale: what changed, why, tradeoffs, and any risks.
- Track unresolved decisions under **Open questions**; mark uncertainty as `UNCONFIRMED` (never guess).
- Maintain a **Working set** section for important files/IDs/commands.

## Updating `CONTINUITY.md`

Do **not** update `CONTINUITY.md` on every edit.

Instead, periodically create a batched “as of <date>” update to `CONTINUITY.md` by summarizing relevant `.continuity/*` ledgers.

