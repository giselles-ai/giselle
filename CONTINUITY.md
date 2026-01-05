
# Continuity Ledger

## Goal
Add a public Runs SDK package (`@giselles-ai/sdk`) under `packages/` to call `POST /api/apps/{appId}/run` and expose `client.app.run()` (and a stubbed `runAndWait()`).

## Constraints/Assumptions
- Adhere to `AGENTS.md` and `CLAUDE.md`.
- Use English for all code and documentation unless strictly required otherwise.
- Maintain the "Less is more" philosophy.
- Data structure for API settings will be designed separately (UI-only implementation for now).
- Feature must be behind feature flag for safe production deploy.

## Key decisions
- Initialized `CONTINUITY.md` to track session state.
- Updated `AGENTS.md` with architectural insights from codebase exploration.
- Added API publishing toggle and display section in `app-entry-configured-view.tsx`.
- Used temporary state for API enabled flag (data structure to be determined separately).
- Feature flag `apiPublishing` will protect the new UI.
- Documented Feature Flags usage pattern in `AGENTS.md`.
- TEMPORARY agreement (spec-only; delete once implemented): public API endpoint format will be `POST /api/v1/apps/{appId}/runs` on same-origin (`studio.giselles.ai`), with conventions: no trailing slash, JSON, reserve `Authorization` header for API key auth (exact scheme TBD).
- TEMPORARY agreement (spec-only; delete once implemented): persist API publishing settings in the protocol `App` object for portability (Studio + self-hosted). Store only non-secret config in `App`:
  - `apiPublishing.isEnabled: boolean`
  - `apiPublishing.apiKeyId?: ApiKeyId` (reference only; never store the secret in App JSON)
  - Do not persist endpoint string; derive it from `appId` and the agreed URL (`POST /api/v1/apps/{appId}/runs`).
- TEMPORARY agreement (spec-only; delete once implemented): API key design for API publishing:
  - Token format: `gsk_{apiKeyId}.{secret}`
  - Auth header: `Authorization: Bearer <token>`
  - Secret storage: hash-only (do NOT store plaintext; do NOT store decryptable ciphertext). The secret is shown once at creation and is not retrievable later.
  - App stores only references/flags (no secret): `app.apiPublishing.apiKeyId?: ApiKeyId`
  - UI must change accordingly: remove “copy API key” for existing keys; instead use “Create new key” → show-once modal and then only show fingerprint/metadata + revoke/rotate actions.
- TEMPORARY agreement (spec-only; delete once implemented): public Runs API design is deferred for now; we keep only secret key generation in the App Entry properties panel.
- Api secret key records live in Giselle Storage (one `ApiSecretRecord` per `apiKeyId` at `apiSecretPath(apiKeyId)`; no scans).
- Active-key policy is **best-effort single-active**: `createApiSecret` revokes the previous key if present; verification accepts any non-revoked record for the requested `appId` (does not enforce “current `app.apiPublishing.apiKeyId` only”).

## State
- Repository is a large monorepo (>10k commits) using pnpm and turbo.
- Architecture involves `apps` (playground, studio) and `packages` (giselle, protocol, etc.).
- API publishing UI implemented with toggle, endpoint display, and API key display with copy functionality.
- Feature Flags documentation added to `AGENTS.md`.

## Done
- Explored workspace structure.
- Analyzed `package.json`, `pnpm-workspace.yaml`.
- Inspected `apps/` and `packages/` contents.
- Verified naming conventions and code style.
- Checked error handling patterns.
- Updated `AGENTS.md` with gathered information.
- Added "Development Philosophy" section from `CLAUDE.md` to `AGENTS.md`.
- Added "Update CONTINUITY.md" to "After Every Code Change" section in `AGENTS.md`.
- Added `CONTINUITY.md` operation guidance in `AGENTS.md`: track unresolved design decisions under **Open questions** and reserve **Next** for concrete execution steps.
- Added API publishing toggle to App Entry Node Properties Panel.
- Added API endpoint and authentication key display with copy functionality.
- Documented Feature Flags usage in `AGENTS.md`.
- Implemented `apiPublishing` feature flag:
  - Added `apiPublishingFlag` to `apps/studio.giselles.ai/flags.ts`.
  - Added `apiPublishing` to `FeatureFlagContextValue` in `packages/react/src/feature-flags/context.ts`.
  - Added to `WorkspaceProvider` in `packages/react/src/workspace/provider.tsx`.
  - Added to data-loader in `apps/studio.giselles.ai/app/workspaces/[workspaceId]/data-loader.ts`.
  - Added to playground in `apps/playground/app/workspaces/[workspaceId]/page.client.tsx`.
  - Used flag in `app-entry-configured-view.tsx` to conditionally render API publishing section.
- Started implementing API publishing key management schemas in `packages/protocol` (`api-publishing/api-secret.ts`).
- Added protocol exports for API publishing and extended `App` schema with `apiPublishing` (non-secret settings).
- Added Giselle Storage path helper for API secrets and started implementing API secret key management in `packages/giselle` (token parsing + create/revoke/verify).
- Exposed API secret key management APIs from `@giselles-ai/giselle` (exports + `giselle.createApiSecret` / `giselle.revokeApiSecret` methods).
- (Rolled back) Removed Studio API routes for API publishing under `/api/v1/apps/{appId}/...` for now; key generation is handled via the Giselle HTTP layer.
- Updated App Entry Properties Panel API publishing UI to use show-once key creation and revoke (no copy of existing keys), behind `apiPublishing`.
- Added unit tests for API publishing token parsing, hashing verification, and single-active revoke behavior in `packages/giselle`.
- Fixed `pnpm build-sdk` failure: replaced promisified `crypto.scrypt` call with a typed async wrapper for TS DTS generation.
- Added a short comment explaining the `gsk_` token prefix meaning in `packages/giselle/src/api-publishing/token.ts`.
- Added `createApiSecret` and `revokeApiSecret` JSON routes to `@giselles-ai/http` (`packages/http/src/router.ts`) to match `packages/giselle/src/giselle.ts`.
- Updated `AGENTS.md` with a rule: when adding a new public API to `packages/giselle/src/giselle.ts`, also add the corresponding route in `packages/http/src/router.ts`.
- Refactored API publishing UI to use `useGiselle()` client methods instead of manual `fetch()` calls, and added a `getCurrentApiSecretRecordForApp` API/route to support that.
- Fixed build/type errors: removed duplicate export of `getCurrentApiSecretRecordForApp` in `packages/giselle/src/api-publishing/api-secrets.ts` and updated studio route to call `giselle.getCurrentApiSecretRecordForApp`.
- Simplified App Entry properties panel to **secret key creation only** (removed run/revoke/toggle flows for now).
- Hardened `lastUsedAt` updates to reduce the chance of overwriting a concurrent revoke.
 - Updated Studio docs to describe `scrypt` env vars for API secret hashing (and removed `GISELLE_API_SECRET_PEPPER`).
 - Started removing `hmac-sha256` support for API secret hashing (protocol schema updated to `scrypt`-only).
 - Simplified protocol `ApiSecretKdf` schema to the single `scrypt` variant.
 - Added `GiselleConfig.apiSecretScrypt` to allow configuring scrypt params + salt size + optional duration logging.
 - Updated `GiselleContext` to carry `apiSecretScrypt` (replacing the removed pepper field).
 - Refactored API publishing secret hashing to be `scrypt`-only, with optional duration logging for observability.
 - Updated `packages/giselle` API secret tests to match the `scrypt`-only implementation.
 - Updated Studio Giselle initialization to configure `apiSecretScrypt` via env (and removed pepper usage).
 - Updated Playground Giselle initialization to configure `apiSecretScrypt` via env (and removed pepper usage).

- Added a new `GenerationOrigin` type: `api` (public API executions).
- Added a Studio API Route to run an App via API key: `POST /api/apps/{appId}/run` with body `{ text: string }` and `Authorization: Bearer gsk_{apiKeyId}.{secret}`.
- Updated origin-type switches/callbacks to handle `api` (task creation, generation execution, trigger resolution, file paths, Studio tracing + Trigger.dev processes).
- Updated `@giselles-ai/giselle` exports to expose API publishing helpers needed by the Studio route.
- Updated App Entry properties panel to show the API URL (copyable) above the Secret Key section so users can discover `appId` easily.

## Now
- Requested: run `mise doctor` in this worktree and report the output.
- Spec work progressed: endpoint format, App persistence approach, and API key design (hash-only + show-once) are recorded as TEMPORARY agreements in this ledger.
- Current behavior: key records live in Giselle Storage (hash-only). `createApiSecret` attempts best-effort single-active by revoking the previous key if present, but verification is record-based and does not enforce “current `app.apiPublishing.apiKeyId` only”.
- Security follow-up: Code scanning flagged `hmac-sha256` for API secret hashing; plan is to remove HMAC and standardize on `scrypt` with configurable parameters.

- Public App Run API is implemented and callable locally; the next missing piece for richer inputs is a public File Upload API so Runs can accept files (e.g. `{ text, file: FileId }`).

- Started implementing SDK package `packages/giselle-ai` (scaffold + initial client code).
- Renamed the SDK npm package from `giselle-ai` to `@giselles-ai/sdk`.
- Added SDK tests for `packages/giselle-ai` (mocked fetch; validates auth/header/path, rejects `input.file`, `runAndWait` stub).
- `packages/giselle-ai` format (Biome) + tests (Vitest) are passing.
- Added `packages/giselle-ai/README.md` documenting usage, auth, and current limitations.
- Updated `@giselles-ai/sdk` to default `baseUrl` to `https://studio.giselles.ai` (no browser use case assumed).
- Updated `@giselles-ai/sdk` tests to cover the default `baseUrl` behavior.
- Updated `packages/giselle-ai/README.md` to reflect the new `baseUrl` default and remove browser guidance.
- Refined `packages/giselle-ai/README.md` usage example to omit `baseUrl` on the happy path and added a server-side-only note.

## Next

- Add documentation / examples for the public run API (`curl` usage) in an appropriate Studio doc page.
- Add a public API to fetch task status/results for API-triggered runs (e.g. `GET /api/tasks/{taskId}` or a dedicated Runs API that returns outputs/steps).
- Define and implement a public upload API to support file parameters in public runs.

## Open questions (UNCONFIRMED if needed)
- What minimal metadata/fingerprint do we need for Api secret records (e.g., createdAt, revokedAt, lastUsedAt, label, fingerprint)?
- If we ever need key listing/rotation UX beyond “current key only”, do we need an `appId → keyIds` index (and where should it live)?
- Should multi-active keys per App ever be supported (explicitly), or is best-effort single-active sufficient?
- (Optional follow-up) When we revive the public Runs API, what should the request/response schema be?
- What are the best `scrypt` parameters for API secret hashing in production (Vercel Functions)? Embed timing instrumentation in the hashing path, observe real numbers in the runtime environment, and decide parameters based on measurements. Ensure parameters are configurable (via `GiselleConfig` / env) so we can adjust them later without a refactor.

## Implementation notes (spec-only; delete once implemented)
- **Key lifecycle**
  - **Create**: generate `apiKeyId` + random `secret` → store `secretHash` with `apiKeyId`/`appId` (+ timestamps) → return token once → update `app.apiPublishing.apiKeyId` if this key is the primary one.
  - **Rotate**: create new key → update `app.apiPublishing.apiKeyId` to new → revoke previous key (set `revokedAt`) depending on chosen active-key policy.
  - **Revoke**: set `revokedAt`; if revoked key is the current `app.apiPublishing.apiKeyId`, clear or replace it.
- **Request verification**
  - Parse `Authorization: Bearer gsk_{apiKeyId}.{secret}`.
  - Load ApiKey by `apiKeyId` (no search-by-prefix).
  - Verify not revoked and `appId` matches the requested app.
  - Compute hash(secret) and constant-time compare with stored `secretHash`.

## Working set (files/ids/commands)
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/app-entry-node-properties-panel/app-entry-configured-view.tsx`
- `apps/studio.giselles.ai/flags.ts`
- `packages/react/src/feature-flags/context.ts`
- `packages/react/src/workspace/provider.tsx`
- `apps/studio.giselles.ai/app/workspaces/[workspaceId]/data-loader.ts`
- `AGENTS.md`
- `CONTINUITY.md`
- `packages/giselle-ai/*`