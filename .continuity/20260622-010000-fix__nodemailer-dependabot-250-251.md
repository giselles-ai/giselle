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

## State

- Edited package.json, regenerated pnpm-lock.yaml (nodemailer@9.0.1). `pnpm -F studio.giselles.ai check-types` passes.

## Done

- Version bump + lockfile + type-check.

## Now

- Commit and open PR.

## Next

- Confirm Dependabot marks both alerts resolved after merge.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- apps/studio.giselles.ai/package.json, pnpm-lock.yaml
- apps/studio.giselles.ai/services/external/email/send-email.ts (usage check)
- `pnpm install --lockfile-only`; `pnpm -F studio.giselles.ai check-types`
- Alerts: dependabot/250, dependabot/251
