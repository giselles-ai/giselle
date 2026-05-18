# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `tmp` Dependabot alert #55 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- Alert #55 closes after the bump:
  - GHSA-52f5-9888-hmc6 / CVE-2025-54798 (low) — arbitrary temporary file/directory write via symlink `dir` parameter (link-following bypass of `_assertIsRelative`). Affects `<= 0.2.3`, patched in `0.2.4`.

## Constraints/Assumptions

- `tmp` is a transitive dev-only dependency. The only version in the tree is `tmp@0.0.33`, pulled in by `external-editor@3.1.0` → `@changesets/cli`.
- `external-editor` declares `tmp: ^0.0.33`, so a pnpm override is needed to lift it across major lines.
- The latest stable `tmp` is `0.2.5`. `external-editor` uses only `tmp.tmpNameSync(opts)`, which is still exported in 0.2.x — the relevant call path is only exercised when a user runs `pnpm changeset` interactively (it opens `$EDITOR`), so it has no impact on `build-sdk` / `check-types` / `test` / CI.

## Key decisions

- Add a version-range `pnpm.overrides` pin: `"tmp@<=0.2.3": "0.2.5"`. The narrow range mirrors the advisory's affected window and lifts only vulnerable resolutions.

## State

- Edit applied to root `package.json` `pnpm.overrides`.
- `pnpm install` updated the lockfile: `tmp@0.0.33` → `tmp@0.2.5`.

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

- Commit and open a PR. The `license_finder` workflow will auto-commit `docs/packages-license.md` to the PR branch. Dependabot will auto-close alert #55 once merged.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — `pnpm.overrides` new range pin for `tmp`.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
