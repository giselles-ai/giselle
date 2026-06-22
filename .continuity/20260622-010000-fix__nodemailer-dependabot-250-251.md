# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix Dependabot alerts #250 and #251 and open a PR.

## Goal (incl. success criteria)

- Resolve the nodemailer advisory by bumping to the patched version (9.0.1).
- Alerts #250 (manifest: apps/studio.giselles.ai/package.json) and #251 (manifest: pnpm-lock.yaml) are the SAME advisory GHSA-p6gq-j5cr-w38f (high): message-level `raw` option bypasses disableFileAccess/disableUrlAccess, enabling arbitrary file read and full-response SSRF. Vulnerable `<= 9.0.0`, patched `9.0.1`.

## Constraints/Assumptions

- nodemailer is a direct dep of apps/studio.giselles.ai only (was 8.0.9).
- Our only usage is services/external/email/send-email.ts: standard createTransport + sendMail (from/to/subject/text/html). No `raw` option, no file/url attachments — so the 8 -> 9 major bump is low risk.

## Key decisions

- Bump nodemailer 8.0.9 -> 9.0.1 in apps/studio.giselles.ai/package.json.
- Also bump @types/nodemailer 6.4.17 -> 8.0.1 (latest; no 9.x typings exist) to track the v9 runtime, after coderabbit flagged a type mismatch. NOTE: real check-types passed even at 6.4.17 once nodemailer@9 was actually installed (the first check-types ran lockfile-only, so node_modules still had v8 — corrected by running full `pnpm install`).

## State

- PR #2950 open. CI all green. Two bot comments handled (replies posted):
  - qodo (packages-license.md stale): auto-resolved by License Compliance CI commit 8878702.
  - coderabbit (@types/nodemailer incompatible, Critical): not an actual failure for our usage, but bumped to 8.0.1 anyway.

## Done

- nodemailer 8.0.9 -> 9.0.1, @types/nodemailer 6.4.17 -> 8.0.1, lockfile, type-check pass. Replied to both bots.

## Now

- Awaiting review/merge.

## Next

- Confirm Dependabot marks both alerts resolved after merge.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- apps/studio.giselles.ai/package.json, pnpm-lock.yaml
- apps/studio.giselles.ai/services/external/email/send-email.ts (usage check)
- `pnpm install --lockfile-only`; `pnpm -F studio.giselles.ai check-types`
- Alerts: dependabot/250, dependabot/251
