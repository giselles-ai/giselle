# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Fix Dependabot alert #169 (GHSA-xq3m-2v4x-88gg, critical): arbitrary code execution in protobufjs < 7.5.5.

## Goal (incl. success criteria)

- Upgrade the transitive `protobufjs` from 7.4.0 to the patched 7.5.5 across the workspace so the alert resolves after merge.

## Constraints/Assumptions

- `protobufjs` enters via `@opentelemetry/otlp-transformer@0.203.0` → transitive, no direct dependency to bump.
- Follow the existing pattern used for similar transitive security fixes (pnpm overrides, e.g. `fast-xml-parser`, `serialize-javascript`).

## Key decisions

- Add `"protobufjs": "7.5.5"` to `pnpm.overrides` in root `package.json`, keeping the 7.x line (8.x has no stable release beyond 8.0.0/8.0.1 and would be a larger change).

## State

- Lockfile updated: `protobufjs@7.5.5` replaces `7.4.0`; `@opentelemetry/otlp-transformer` now pulls 7.5.5.

## Done

- Added pnpm override.
- Ran `pnpm install --lockfile-only`; lockfile updated.

## Now

- Open PR against `main`.

## Next

- Verify Dependabot alert #169 auto-closes after merge.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (pnpm overrides)
- `pnpm-lock.yaml`
- Branch: `fix/bump-protobufjs-security`
- Alert: https://github.com/giselles-ai/giselle/security/dependabot/169
