# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `picomatch` Dependabot alerts #137 and #148 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- Both alerts close after the bump. They cover the same advisory
  GHSA-3v7f-55p6-f55p / CVE-2026-33672 (medium) — method injection via
  POSIX bracket expressions in `POSIX_REGEX_SOURCE`, leading to incorrect
  glob matching.
  - #137 targets the 4.x range: `>= 4.0.0, < 4.0.4`, patched in `4.0.4`.
  - #148 targets the 2.x range: `< 2.3.2`, patched in `2.3.2`.

## Constraints/Assumptions

- `picomatch` is a transitive dev dependency only. Two versions are present in the tree:
  - `picomatch@2.3.1` — via `@changesets/cli` → `micromatch` and other tooling.
  - `picomatch@4.0.3` — via `vite`/`turbo`/`vitest` family tools through `fdir`.
- No application code processes untrusted glob patterns through picomatch; impact in this repo is limited to build/test tooling, but the alerts still need to close.

## Key decisions

- Add two version-range `pnpm.overrides` pins:
  - `"picomatch@>=4.0.0 <4.0.4": "4.0.4"`
  - `"picomatch@<2.3.2": "2.3.2"`

  Range overrides avoid forcing the 2.x consumers onto 4.x (potential ESM/CJS breakage) and only upgrade vulnerable versions to the nearest patched release on the same major line.

## State

- Edits applied to root `package.json` `pnpm.overrides`.
- `pnpm install` updated the lockfile: `picomatch@2.3.1` → `2.3.2`, `picomatch@4.0.3` → `4.0.4`.

## Done

- Updated root `package.json` overrides.
- `pnpm install` → success.
- `pnpm format` → clean.
- `pnpm build-sdk` → 28/28 successful.
- `pnpm check-types` → 31/31 successful.
- `pnpm test` → 9/9 tasks pass.

## Now

- Awaiting commit and PR.

## Next

- Commit and open a PR. The `license_finder` workflow will auto-commit `docs/packages-license.md` to the PR branch. Dependabot will auto-close #137 and #148 once merged.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — `pnpm.overrides` two new picomatch range pins.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
