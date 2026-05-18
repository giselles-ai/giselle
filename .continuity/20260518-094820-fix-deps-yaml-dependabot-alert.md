# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `yaml` Dependabot alert #138 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- Alert #138 closes after the bump:
  - GHSA-48c2-rrv3-qjmp / CVE-2026-33532 (medium) — Stack overflow via deeply nested YAML flow sequences during compose/resolve phase. Affects `>= 2.0.0, < 2.8.3` (and `>= 1.0.0, < 1.10.3`), patched in `2.8.3` / `1.10.3`.

## Constraints/Assumptions

- `yaml` is a transitive runtime dependency only. The only version present in the tree is `yaml@2.7.0`, pulled in by `tsup`, `vitest` config-loader, etc.
- No `yaml@1.x` consumers found in the resolved tree, so only the 2.x range needs an override.

## Key decisions

- Add a version-range `pnpm.overrides` pin: `"yaml@>=2.0.0 <2.8.3": "2.8.3"`. The narrow range matches the advisory's affected window and lifts only vulnerable resolutions; if a future dependency declares `yaml@^2.9` it won't be clamped down.

## State

- Edit applied to root `package.json` `pnpm.overrides`.
- `pnpm install` updated the lockfile: `yaml@2.7.0` → `yaml@2.8.3` everywhere.

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

- Commit and open a PR. The `license_finder` workflow will auto-commit `docs/packages-license.md` to the PR branch. Dependabot will auto-close alert #138 once merged.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — `pnpm.overrides` new range pin.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
