# Remove Unused internal-api Server Actions

## Summary

Removed unused Server Actions from `apps/studio.giselles.ai/lib/internal-api/` to reduce code complexity.

Note: The underlying SDK methods (e.g., `giselle.createWorkspace`) are still used directly in server-side code. Only the internal-api wrapper layer was unused.

## Deleted Items

### Entire files deleted
- `apps/studio.giselles.ai/lib/internal-api/workspaces.ts`
  - `createWorkspace`, `createSampleWorkspaces`, `getWorkspace`, `updateWorkspace`
- `apps/studio.giselles.ai/lib/internal-api/data-stores.ts`
  - `createDataStore`, `getDataStore`, `updateDataStore`, `deleteDataStore`

### Methods deleted
- Removed `generateContent` from `generations.ts`

## Investigation Method

Searched the entire codebase for `client.funcname(` pattern to identify unused methods in the internal-api wrapper layer.

## Investigation Results

Investigated usage in workflow-designer-ui, apps/studio.giselles.ai/app, and packages/react.
The following internal-api wrapper methods were not called via GiselleClient:
- All methods in `workspaces.ts`
- All methods in `data-stores.ts`
- `generateContent` in `generations.ts`

Other methods were used by components in packages/react via GiselleClient.
