# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `nodemailer` Dependabot alerts #140, #141, #161, #162 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- All four alerts close after the bump. They reduce to two underlying advisories:
  - GHSA-c7w3-x93f-qmm8 (low) — SMTP command injection via unsanitized `envelope.size` (#140 lockfile / #141 direct dep). Patched in `8.0.4`.
  - GHSA-vvjj-xcjg-gr5g (medium) — SMTP command injection via unsanitized transport `name` (EHLO/HELO) (#161 lockfile / #162 direct dep). Patched in `8.0.5`.

## Constraints/Assumptions

- `nodemailer` is a direct dependency declared in `apps/studio.giselles.ai/package.json` (was pinned at `7.0.11`).
- Only one call site uses `nodemailer`: `apps/studio.giselles.ai/services/external/email/send-email.ts`. It calls `createTransport({ host, port, secure, auth })` and `sendMail({ from, to, subject, text, html })`. It does NOT use the vulnerable `envelope.size` field or a custom transport `name`, so real-world exposure is negligible — but the alerts still need to close.
- Latest stable is `8.0.7`. Major bump `7.x → 8.x` but the public API surface used in `send-email.ts` is unchanged.

## Key decisions

- Bump `nodemailer` directly in `apps/studio.giselles.ai/package.json` from `7.0.11` → `8.0.7` (latest, > 8.0.5 patched threshold). No root `pnpm.overrides` entry needed because it is a direct dep.

## State

- Edit applied to `apps/studio.giselles.ai/package.json`.
- `pnpm install` updated the lockfile to `nodemailer@8.0.7`.

## Done

- Updated direct dep version.
- `pnpm install` → success.
- `pnpm format` → clean.
- `pnpm build-sdk` → 28/28 successful.
- `pnpm check-types` → 31/31 successful (cache miss only on `studio.giselles.ai:check-types`).
- `pnpm test` → 9/9 tasks, all suites pass.

## Now

- Awaiting commit and PR.

## Next

- Commit and open a PR. The `license_finder` workflow will auto-commit `docs/packages-license.md` to the PR branch. Dependabot will auto-close alerts #140, #141, #161, #162 once merged.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/package.json` — `dependencies.nodemailer`.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
