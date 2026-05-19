# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `brace-expansion` Dependabot alert #209 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- Alert #209 closes after the bump:
  - GHSA-jxxr-4gwj-5jf2 / CVE-2026-45149 (medium, CVSS 6.5) — Large numeric range like `{1..10000000}` defeats the documented `max` DoS protection. Affected: `>= 5.0.0, < 5.0.6`. Patched: `5.0.6`.

## Constraints/Assumptions

- `brace-expansion` is a transitive runtime dependency. The repo already has a range pin in `pnpm.overrides`: `"brace-expansion@>=4.0.0 <5.0.5": "5.0.5"`. Since `5.0.5` is now itself flagged, the range must extend to include `5.0.5` and target `5.0.6`.
- Two existing resolutions in the tree (lockfile lines around 5529, 13568) pointed at `5.0.5`; both consumers (foreground/minimatch chains) accept `5.0.6`.

## Key decisions

- Replace `"brace-expansion@>=4.0.0 <5.0.5": "5.0.5"` with `"brace-expansion@>=4.0.0 <5.0.6": "5.0.6"`. Continue using a range-scoped override so only vulnerable resolutions are lifted.

## State

- Edit applied to root `package.json` `pnpm.overrides`.
- `pnpm install` updated the lockfile: `brace-expansion@5.0.5` → `brace-expansion@5.0.6`.

## Done

- Updated root `package.json` overrides.
- `pnpm install` → success.
- `pnpm format` → clean (1529 files, no fixes applied).
- `pnpm build-sdk` → 28/28 successful.
- `pnpm check-types` → 31/31 successful.
- `pnpm test` → 9/9 tasks pass (218 + 254 tests).

## Now

- Awaiting commit and PR.

## Next

- Commit and open a PR. The `license_finder` workflow will auto-commit `docs/packages-license.md` to the PR branch. Dependabot will auto-close alert #209 once merged.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — `pnpm.overrides` extended range pin for `brace-expansion`.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
