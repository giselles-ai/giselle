# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `systeminformation` Dependabot alert #208 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- Alert #208 closes after the bump:
  - `systeminformation` GHSA-hvx9-hwr7-wjj9 / CVE-2026-44724 (high) — Linux command injection in `networkInterfaces()` via unsanitized NetworkManager connection profile name.

## Constraints/Assumptions

- `systeminformation` is not a direct workspace dependency; it enters the tree transitively via `@opentelemetry/host-metrics` (pulled in by `@trigger.dev/core`). It is already pinned via root `pnpm.overrides`.
- The advisory only requires bumping to `5.31.6`; this stays on the 5.x line.

## Key decisions

- Bump `pnpm.overrides.systeminformation` from `5.31.5` → `5.31.6` — the first patched version per the advisory.

## State

- Edit applied to root `package.json` `pnpm.overrides`.
- `pnpm install` updated the lockfile to `systeminformation@5.31.6`.

## Done

- Updated root `package.json` overrides.
- `pnpm install` → success.
- `pnpm format` → clean (pre-existing broken-symlink warning in `apps/studio.giselles.ai/out/static`).
- `pnpm build-sdk` → 28/28 successful (FULL TURBO cache).
- `pnpm check-types` → 31/31 successful.
- `pnpm test` → 218/218 tests pass.

## Now

- Awaiting commit and PR.

## Next

- Commit the override bump and open a PR. The `license_finder` workflow will auto-commit `docs/packages-license.md` to the PR branch. Dependabot will auto-close alert #208 once merged.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — `pnpm.overrides.systeminformation`.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
