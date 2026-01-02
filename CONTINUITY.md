
# Continuity Ledger

## Goal
Add API publishing settings UI to App Entry Node Properties Panel, protected by feature flag for safe production deploy.

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

## Now
- Spec work progressed: endpoint format, App persistence approach, and API key design (hash-only + show-once) are recorded as TEMPORARY agreements in this ledger.
- Remaining work is to decide the persistence location/model for ApiKey records and active-key policy, then implement UI + backend accordingly.

## Next
- Decide where ApiKey records live (Studio DB vs Giselle storage JSON index) and the minimal metadata/fingerprint needs.
- Decide active-key policy (allow multiple active keys vs auto-revoke on new key).
- Implement the agreed UI changes (show-once key creation, list metadata, revoke/rotate) behind `apiPublishing`.
- Implement backend endpoints for create/rotate/revoke and request authentication for `POST /api/v1/apps/{appId}/runs`.

## Open questions (UNCONFIRMED if needed)
- What is the minimal persistence location for ApiKey records (Studio DB table vs Giselle storage JSON index) and what metadata do we need (createdAt, revokedAt, lastUsedAt, label, fingerprint)?
- Should multiple active keys per App be allowed, or should creating a new key auto-revoke previous keys?
- (Optional follow-up) What should the request/response schema for `POST /api/v1/apps/{appId}/runs` be (inputs, run id, status, errors)?

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
