# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `ip-address` Dependabot alert #177 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- Alert #177 closes after the bump:
  - `ip-address` GHSA-v2v4-37r5-5v8g / CVE-2026-42338 (medium) — XSS in `Address6.group()`, `Address6.link()`, `helpers.spanAll()`, and `AddressError.parseMessage` when untrusted input is rendered as HTML.

## Constraints/Assumptions

- `ip-address` is not a direct workspace dependency. It enters the tree transitively via `express-rate-limit@8.2.2` (already pinned via root `pnpm.overrides`).
- The advisory's first patched version is `10.1.1` and it is the only version in the 10.x line that addresses the four related XSS issues.
- Real-world exposure is described by upstream as extremely limited (the HTML-emitting methods appear unused across published consumers), but a bump is still the right action to close the alert.

## Key decisions

- Add a new `pnpm.overrides.ip-address` pin at `10.1.1` rather than waiting for an upstream `express-rate-limit` release. This is the minimal, surgical fix.

## State

- Edit applied to root `package.json` `pnpm.overrides` (added `"ip-address": "10.1.1"`).
- `pnpm install` updated the lockfile to `ip-address@10.1.1`.

## Done

- Updated root `package.json` overrides.
- `pnpm install` → success.
- `pnpm format` → clean.
- `pnpm build-sdk` → 28/28 successful.
- `pnpm check-types` → 31/31 successful.
- `pnpm test` → all suites pass (9/9 tasks, 254 + 218 + 5 + ... tests).

## Now

- Awaiting commit and PR.

## Next

- Commit the override addition and open a PR. The `license_finder` workflow will auto-commit `docs/packages-license.md` to the PR branch. Dependabot will auto-close alert #177 once merged.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — `pnpm.overrides.ip-address`.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
