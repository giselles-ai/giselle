# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix all current GitHub Dependabot security alerts for `giselles-ai/giselle`.
- Keep dependency changes as small as practical.
- Create a pull request with the fix.

## Goal (incl. success criteria)

- Open Dependabot alerts are cleared by upgrading vulnerable npm dependencies to patched versions.
- Relevant package manifests and `pnpm-lock.yaml` are updated.
- Verification runs are recorded.
- Changes are committed, pushed, and published as a draft PR.

## Constraints/Assumptions

- Follow `AGENTS.md`: less is more, use existing patterns, update this ledger after code changes.
- Work from a clean branch off `main`.
- `gh auth status` reports an invalid saved token, but `gh api` can still read Dependabot alerts in this environment.

## Key decisions

- Use the live Dependabot alert REST endpoint as the source of truth.
- Scope the branch to currently open alerts only.
- Follow existing `pnpm.overrides` style for transitive security fixes.
- Use a narrow `read-yaml-file@2.1.0` override instead of forcing `js-yaml@4` under code that calls the removed `safeLoad` API.

## State

- Branch: `codex/fix-dependabot-alerts`.
- Implementation complete; PR #2942 CI follow-up pushed.
- `pnpm audit --json` now reports only `@ai-sdk/provider-utils` (`patched_versions: <0.0.0`), matching the previously dismissed Dependabot alert.

## Done

- Queried GitHub Dependabot alerts.
- Created branch `codex/fix-dependabot-alerts`.
- Updated patched versions for open alerts: `hono`, `markdown-it`, `@opentelemetry/core`, `nodemailer`, `protobufjs`, `tar`, `vite`, `js-yaml`, `@babel/core`, and both `ws` major lines.
- Fixed additional patchable audit items: `smol-toml` via `knip@6.17.1` and `js-yaml@3` via `@changesets/cli@^2.31.0` plus `read-yaml-file@2.1.0`.
- Removed stale `js-yaml@3` override.
- Verification passed:
  - `pnpm format`
  - `pnpm build-sdk`
  - `pnpm check-types`
  - `pnpm tidy`
  - `pnpm test`
  - `pnpm install --frozen-lockfile --lockfile-only`
  - `pnpm audit --json` (only no-patch/dismissed `@ai-sdk/provider-utils` remains)
- CI job `check` failed on PR #2942 because GitHub Actions runs `pnpm knip`; `knip@6.17.1` reported unlisted `rg` binaries in scripts on the runner where ripgrep is not installed.
- Added `rg` to `knip.ts` `ignoreBinaries`.
- CI follow-up verification passed:
  - `pnpm knip`
  - `PATH=/Users/tadashi.shigeoka/.local/share/mise/installs/node/24/bin:/usr/bin:/bin pnpm knip`
  - `pnpm tidy`
  - `pnpm format`

## Now

- Await PR #2942 CI rerun.

## Next

- None after PR creation.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json`
- `apps/studio.giselles.ai/package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `gh api repos/giselles-ai/giselle/dependabot/alerts`
