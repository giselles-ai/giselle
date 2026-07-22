# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Remove the `next`, `@next/env`, and `@next/third-parties` minimum release-age exclusions.
- Base the change on the latest `main` and create a pull request.

## Goal (incl. success criteria)

- Restore the normal 24-hour release-age gate for all Next.js packages without changing resolved dependencies.
- Pass repository verification and publish a draft PR against `main`.

## Constraints/Assumptions

- Follow `AGENTS.md` and keep the change limited to the three requested exclusions.
- Preserve the remaining Giselle package exclusions.

## Key decisions

- Created `agent/remove-next-release-age-exclusions` from latest `origin/main` (`2b14edfc9`).
- Remove the three package-wide exclusions entirely; do not replace them with version-specific entries.

## State

- Implementation and verification complete; ready to publish.

## Done

- Updated local `main` to the merged Dependabot PR.
- Removed `next`, `@next/env`, and `@next/third-parties` from `minimumReleaseAgeExclude`.
- Confirmed `pnpm install --frozen-lockfile` succeeds with the normal release-age gate and no lockfile changes.
- Passed `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, and `pnpm test`.

## Now

- Commit and publish the verified change.

## Next

- Commit, push, and open a draft PR against `main`.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `pnpm-workspace.yaml`
- `.continuity/20260722-100842-agent__remove-next-release-age-exclusions.md`
- `pnpm install --frozen-lockfile`
