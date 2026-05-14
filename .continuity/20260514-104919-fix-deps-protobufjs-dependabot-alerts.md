# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Resolve open `protobufjs` / `@protobufjs/utf8` Dependabot alerts #200–#207 on github.com/giselles-ai/giselle/security/dependabot.

## Goal (incl. success criteria)

- All 8 protobufjs-family Dependabot alerts close after the bump:
  - #200 `@protobufjs/utf8` GHSA-q6x5-8v7m-xcrf / CVE-2026-44288 (overlong UTF-8 decoding)
  - #201 `protobufjs` GHSA-q6x5-8v7m-xcrf / CVE-2026-44288 (overlong UTF-8 decoding)
  - #202 `protobufjs` GHSA-jvwf-75h9-cwgg / CVE-2026-44290 (process-wide DoS via unsafe option paths)
  - #203 `protobufjs` GHSA-75px-5xx7-5xc7 / CVE-2026-44291 (codegen gadget after prototype pollution)
  - #204 `protobufjs` GHSA-fx83-v9x8-x52w / CVE-2026-44292 (prototype injection in generated constructors)
  - #205 `protobufjs` GHSA-2pr8-phx7-x9h3 / CVE-2026-44294 (DoS from crafted field names)
  - #206 `protobufjs` GHSA-66ff-xgx4-vchm / CVE-2026-44293 (code injection through bytes field defaults)
  - #207 `protobufjs` GHSA-685m-2w69-288q / CVE-2026-44289 (DoS via unbounded recursion)

## Constraints/Assumptions

- `protobufjs` is not a direct workspace dependency; it enters the tree transitively via `@opentelemetry/otlp-*` (pulled in by `@trigger.dev/core`). It is already pinned via root `pnpm.overrides`.
- Staying on the 7.x line avoids a major-version bump (8.x exists but isn't needed; 7.5.6 is the patched 7.x release).
- `@protobufjs/utf8` upgrades automatically as a transitive of `protobufjs@7.5.6` (1.1.0 → 1.1.1).

## Key decisions

- Bump `pnpm.overrides.protobufjs` from `7.5.5` → `7.5.6` — the first patched 7.x version covering all 8 advisories.

## State

- Edit applied to root `package.json` `pnpm.overrides`.
- `pnpm install` replaced 4 packages; lockfile now resolves `protobufjs@7.5.6` and `@protobufjs/utf8@1.1.1` (also pulls `@protobufjs/codegen@2.0.5`, `@protobufjs/inquire@1.1.1`).

## Done

- Updated root `package.json` overrides.
- `pnpm install` → success.
- `pnpm format` → clean (pre-existing broken-symlink warning in `apps/studio.giselles.ai/out/static`).
- `pnpm build-sdk` → 28/28 successful (FULL TURBO cache hit; no source touched).
- `pnpm check-types` → 31/31 successful.
- `pnpm test` → 218/218 tests pass.

## Now

- Awaiting commit and PR.

## Next

- Commit the override bump and open a PR. Dependabot will auto-close alerts #200–#207 once the change reaches the default branch.

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- `package.json` (root) — `pnpm.overrides.protobufjs`.
- `pnpm-lock.yaml` — regenerated.
- Verification: `pnpm install`, `pnpm format`, `pnpm build-sdk`, `pnpm check-types`, `pnpm test`.
