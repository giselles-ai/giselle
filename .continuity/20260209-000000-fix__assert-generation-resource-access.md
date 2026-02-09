# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add resource-level authorization to `startContentGeneration` to prevent cross-workspace resource injection
- Validate that secretIds, dataStoreIds, and vector stores in generation context belong to the correct workspace/team

## Goal (incl. success criteria)

- `assertGenerationResourceAccess` helper validates all resource references in a generation context
- Applied to both new and existing generation paths in `startContentGeneration`
- format / build-sdk / check-types / tidy / test all pass

## Constraints/Assumptions

- Generation type uses `GenerationContextLike` (loose types), so strict schemas used for safe parsing
- `DocumentVectorStoreId` is a template literal type (`dvs_${string}`), not using `createIdGenerator` (which uses `-` separator)

## Key decisions

- Used `safeParse` with strict Zod schemas (`TextGenerationContent`, `ContentGenerationContent`, `DataStoreContent`) to extract typed fields from loose content types
- Fail closed on secrets without `workspaceId`
- DataStore ownership checked via `teamDbId` in the `data_stores` table
- Removed node ID validation: caused false positives when nodes placed and immediately executed before workspace persisted; no security benefit since node IDs carry no sensitive data
- Added official vector store bypass: official GitHub/Document vector stores (owned by `officialVectorStoreConfig.teamDbId` and in the allow list) are accessible to all teams
- `isDocumentVectorStoreOwnedByTeam` accepts `DocumentVectorStoreId` (not `string`); caller validates `dvs_` prefix
- `storage.getJson` for secrets wrapped with `.catch()` to convert internal storage errors to access denied

## State

- PR #2713 open, review feedback addressed

## Done

- Created `apps/studio.giselles.ai/lib/assert-generation-resource-access.ts`
- Created `apps/studio.giselles.ai/lib/resource-ownership.ts`
- Modified `apps/studio.giselles.ai/lib/internal-api/generations.ts`
- Validates: secretIds, dataStoreIds, GitHub vector stores (owner+repo), document vector stores
- Fixed: `setGeneration` update path validates against merged generation (preserving `existingGeneration.context.origin`)
- Added official vector store bypass in `resource-ownership.ts`
- Fixed `DocumentVectorStoreId` unsafe type cast (accepts branded type, caller validates prefix)
- Added `.catch()` on `storage.getJson` to prevent internal error leakage
- Removed node ID validation (false positives on immediate execution, no security value)
- Removed Japanese TODO comments from test file
- All verification steps pass: format, build-sdk, check-types, tidy, test

## Now

- Ready for push / re-review

## Next

- (Future) Ensure secrets always have `workspaceId` set at creation time

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/lib/assert-generation-resource-access.ts` (modified)
- `apps/studio.giselles.ai/lib/assert-generation-resource-access.test.ts` (modified)
- `apps/studio.giselles.ai/lib/resource-ownership.ts` (modified)
- `apps/studio.giselles.ai/lib/internal-api/generations.ts` (modified)
