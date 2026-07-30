# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix every open Dependabot alert in `giselles-ai/giselle`.
- Verify the dependency remediation and create a pull request.

## Goal (incl. success criteria)

- Upgrade all vulnerable dependency resolutions to their first patched versions or newer.
- Pass the repository-required validation sequence.
- Publish the changes as a draft pull request.

## Constraints/Assumptions

- Keep the patch limited to dependency manifests, the lockfile, and this ledger.
- Follow the repository's "Less is more" principle.
- Preserve existing application behavior and dependency topology.

## Key decisions

- Upgrade Next.js from 16.2.6 to 16.2.11 across the catalog, companion packages, and the React Email override.
- Upgrade the direct Studio Valibot dependency from 1.2.0 to 1.4.2.

## State

- Complete; draft PR #2963 is open.

## Done

- Enumerated all 10 open Dependabot alerts through the GitHub API.
- Mapped the alerts to two vulnerable dependency resolutions: Next.js and Valibot.
- Created branch `agent/fix-dependabot-alerts-20260730`.
- Regenerated the lockfile and confirmed the vulnerable versions are absent.
- Passed `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm tidy`, and `pnpm test`.
- Opened draft PR https://github.com/giselles-ai/giselle/pull/2963.

## Now

- Await PR review and CI.

## Next

- Monitor PR checks.

## Open questions (UNCONFIRMED if needed)

- `pnpm audit --audit-level moderate` reports unrelated newer advisories in PostCSS, brace-expansion, smol-toml, and tar that were not among GitHub's 10 open Dependabot alerts at the time of this request.

## Working set (files/ids/commands)

- `pnpm-workspace.yaml`
- `package.json`
- `apps/studio.giselles.ai/package.json`
- `pnpm-lock.yaml`
- `pnpm install`
- `pnpm format && pnpm build-sdk && pnpm check-types && pnpm tidy && pnpm test`
