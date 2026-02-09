# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Add resource-level authorization to `startContentGeneration` to prevent cross-workspace resource injection
- Validate that nodeIds, secretIds, and dataStoreIds in generation context belong to the correct workspace/team

## Goal (incl. success criteria)

- `assertGenerationResourceAccess` helper validates all resource references in a generation context
- Applied to both new and existing generation paths in `startContentGeneration`
- format / build-sdk / check-types / tidy / test all pass

## Constraints/Assumptions

- Generation type uses `GenerationContextLike` (loose types), so strict schemas used for safe parsing

## Key decisions

- Used `safeParse` with strict Zod schemas (`TextGenerationContent`, `ContentGenerationContent`, `DataStoreContent`) to extract typed fields from loose content types
- Fail closed on secrets without `workspaceId`
- DataStore ownership checked via `teamDbId` in the `data_stores` table

## State

- Implementation complete, cross-workspace resource injection bug in `setGeneration` fixed

## Done

- Created `apps/studio.giselles.ai/lib/assert-generation-resource-access.ts`
- Modified `apps/studio.giselles.ai/lib/internal-api/generations.ts`
- Validates: nodeIds, secretIds, dataStoreIds, GitHub vector stores (owner+repo), document vector stores
- Fixed: `setGeneration` update path now validates resources against the merged generation (with `existingGeneration.context.origin`) instead of `input.generation` (user-controlled origin), preventing cross-workspace resource injection
- All verification steps pass: format, build-sdk, check-types, tidy, test

## Now

- Ready for commit / PR

## Next

- (Future) Ensure secrets always have `workspaceId` set at creation time

## Open questions (UNCONFIRMED if needed)

- None

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/lib/assert-generation-resource-access.ts` (new)
- `apps/studio.giselles.ai/lib/internal-api/generations.ts` (modified)
