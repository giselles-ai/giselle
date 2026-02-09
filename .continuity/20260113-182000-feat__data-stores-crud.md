# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Implement Data Store settings page to allow teams to manage external PostgreSQL database connections
- Securely encrypt and store connection strings
- Fully implement CRUD operations (Create, Read, Update, Delete)

## Goal (incl. success criteria)

- Visiting `/settings/team/data-stores` displays the Data Store list
- Create dialog allows entering name and connection string
- Connection string is encrypted via Vault and stored in giselleStorage
- Data Stores can be edited and deleted
- Sidebar shows Data Stores link

## Constraints/Assumptions

- `feat/data-store-registry`, `feat/protocol-data-store`, and `feat/data-stores-table` are merged
- Secrets are stored in global scope without `workspaceId` (no Team Index required)
- Connection strings are not displayed in UI (for security reasons)

## Key decisions

- Store secrets without `workspaceId` (global scope)
- `secretId` is generated as `scrt_` + suffix of DataStoreId
- giselleStorage path: `data-stores/{id}/data-store.json`
- Secret path: `secrets/{secretId}/secret.json`

## State

- Implementation complete, awaiting review

## Done

- `apps/.../settings/team/data-stores/types.ts` - Type definitions
- `apps/.../settings/team/data-stores/actions.ts` - Server Actions (CRUD)
- `apps/.../settings/team/data-stores/page.tsx` - Server Component
- `apps/.../settings/team/data-stores/page-client.tsx` - Client Component
- `apps/.../settings/team/data-stores/data-store-create-dialog.tsx` - Create dialog
- `apps/.../settings/team/data-stores/data-store-edit-dialog.tsx` - Edit dialog
- `apps/.../ui/sidebar/sidebar.tsx` - Added link to sidebar
- `packages/protocol/src/secret/index.ts` - Made workspaceId optional in Secret
- `packages/giselle/src/secrets/add-secret.ts` - Support optional workspaceId
- `packages/giselle/src/secrets/delete-secret.ts` - Handle undefined workspaceId
- `pnpm format` - Code formatting
- `pnpm build-sdk` - Build verification
- `pnpm check-types` - Type checking
- `pnpm tidy` - Unused code check

## Now

- Complete

## Next

- Create PR

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- apps/studio.giselles.ai/app/(main)/settings/team/data-stores/types.ts
- apps/studio.giselles.ai/app/(main)/settings/team/data-stores/actions.ts
- apps/studio.giselles.ai/app/(main)/settings/team/data-stores/page.tsx
- apps/studio.giselles.ai/app/(main)/settings/team/data-stores/page-client.tsx
- apps/studio.giselles.ai/app/(main)/settings/team/data-stores/data-store-create-dialog.tsx
- apps/studio.giselles.ai/app/(main)/settings/team/data-stores/data-store-edit-dialog.tsx
- apps/studio.giselles.ai/app/(main)/ui/sidebar/sidebar.tsx
- packages/protocol/src/secret/index.ts
- packages/giselle/src/secrets/add-secret.ts
- packages/giselle/src/secrets/delete-secret.ts
