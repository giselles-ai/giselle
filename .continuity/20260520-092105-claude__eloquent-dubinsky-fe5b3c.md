# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `ws` Dependabot alert #210 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- Alert #210 closes after the bump:
  - GHSA-58qx-3vcg-4xpx / CVE-2026-45736 (medium, CVSS 4.4) — Uninitialized memory disclosure in `websocket.close()` when a `TypedArray` is passed as the `reason` argument. Affected: `>= 8.0.0, < 8.20.1`. Patched: `8.20.1`.

## Constraints/Assumptions

- `ws` is a transitive runtime dependency. Lockfile had four vulnerable 8.x resolutions (`8.17.1`, `8.18.0`, `8.18.2`, `8.20.0`) pulled in by `engine.io`, `playwright-core`, viem/isows, jsdom, openai, and others.
- `ws@7.5.10` is also present (via `webpack-bundle-analyzer`) but falls outside the vulnerable range (`>= 8.0.0`), so it is left untouched.

## Key decisions

- Add `"ws@>=8.0.0 <8.20.1": "8.20.1"` to root `pnpm.overrides`. Range-scoped override leaves the unrelated `7.x` resolution alone.

## State

- Edit applied to root `package.json` `pnpm.overrides`.
- `pnpm install` collapsed the four vulnerable 8.x resolutions into a single `ws@8.20.1` entry; `7.5.10` remains for `webpack-bundle-analyzer`.

## Done

- Updated root `package.json` overrides.
- `pnpm install` → success.
- `pnpm format` → clean (1529 files, no fixes applied).
- `pnpm build-sdk` → 28/28 successful.
- `pnpm check-types` → 31/31 successful.
- `pnpm test` → 9/9 tasks pass.

## Now

- Awaiting commit and PR.

## Next

- Commit and open a PR. Dependabot will auto-close alert #210 once merged. The `license_finder` workflow will refresh `docs/packages-license.md` on the PR branch.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — added `ws` range pin to `pnpm.overrides`.
- `pnpm-lock.yaml` — regenerated; only `ws@7.5.10` and `ws@8.20.1` remain.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
