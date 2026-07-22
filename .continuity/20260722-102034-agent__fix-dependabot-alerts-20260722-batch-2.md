# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix all current Dependabot alerts and create a pull request.

## Goal (incl. success criteria)

- Resolve all 13 open Dependabot alerts with the smallest safe dependency overrides.
- Pass the repository verification suite and publish a draft PR from latest `main`.

## Constraints/Assumptions

- Follow `AGENTS.md`; keep changes limited to dependency security remediation.
- Use the strictest patched version when multiple alerts affect the same package.
- Do not add `minimumReleaseAgeExclude` entries; every selected release is older than 24 hours.

## Key decisions

- Created `agent/fix-dependabot-alerts-20260722-batch-2` from latest `origin/main` (`e59eac8df`).
- Consolidate 13 alerts into seven root overrides: `fast-uri@3.1.4`, `sharp@0.35.0`, `linkify-it@5.0.2`, `hono@4.12.27`, `@hono/node-server@2.0.5`, `tar@7.5.19`, and `js-yaml@4.3.0`.
- Update the direct `tar` catalog entry to `7.5.19`; the override alone does not replace an explicitly pinned direct dependency.

## State

- Complete; changes are committed, pushed, and available in draft PR #2961.

## Done

- Confirmed alerts #258–#270 are open and identified their patched versions.
- Confirmed all selected releases are older than 24 hours.
- Updated the root overrides in `package.json`.
- Updated the direct `tar` catalog version in `pnpm-workspace.yaml`.
- Regenerated `pnpm-lock.yaml` and confirmed all alert-affected resolutions use patched versions.
- Passed `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, and `pnpm test`.
- Committed the fixes as `08d050a20`, pushed the branch, and opened draft PR #2961 against `main`.

## Now

- N/A (complete).

## Next

- N/A (complete).

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json`
- `pnpm-lock.yaml`
- `.continuity/20260722-102034-agent__fix-dependabot-alerts-20260722-batch-2.md`
- Dependabot alerts #258–#270
- `https://github.com/giselles-ai/giselle/pull/2961`
