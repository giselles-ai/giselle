# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Extract Data Query Node UI from `feat/add-data-store-node` into a new branch from `feat/add-data-stores-workflow-designer-ui`, while keeping current `useDataStore` behavior intact.

## Goal (incl. success criteria)

- Data Query Node UI is available in workflow designer UI (icon, toolbar, properties panel, styling, result view), with connections and styling aligned to current branch conventions.

## Constraints/Assumptions

- Do not edit the plan file.
- Respect current branch (`feat/add-data-stores-workflow-designer-ui`) `useDataStore` and `packages/react` implementations.
- Backend calls remain placeholders; UI-only integration.

## Key decisions

- Create a new branch `feat/add-data-query-node` and implement the plan there.

## State

- Data Query Node UI implementation applied on `feat/add-data-query-node`.

## Done

- Created branch `feat/add-data-query-node`.
- Added Data Query Node UI files (properties panel, icon, result view).
- Wired Data Query Node into toolbar, properties panel, card styling, connectors, and text editor styles.
- Updated connected sources for image generation and query panels.
- Added data query color tokens.
- Both Data Store and Data Query nodes are hidden behind `dataStoreFlag` feature flag in toolbar.

## Now

- Awaiting review or additional tweaks.

## Next

- Run feature verification in UI as needed.

## Open questions (UNCONFIRMED if needed)

- None yet.

## Working set (files/ids/commands)

- `internal-packages/workflow-designer-ui/src/editor/properties-panel/data-query-properties-panel/*`
- `internal-packages/workflow-designer-ui/src/icons/node/data-query-icon.tsx`
- `internal-packages/workflow-designer-ui/src/ui/data-query-result-view.tsx`
- `internal-packages/ui/styles/tokens.css`
- `apps/studio.giselles.ai/app/globals.css`
- `internal-packages/workflow-designer-ui/src/editor/tool/toolbar/toolbar.tsx`
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/index.tsx`
- `internal-packages/workflow-designer-ui/src/editor/node/card-node.tsx`
- `internal-packages/workflow-designer-ui/src/editor/connector/component.tsx`
- `packages/text-editor/src/react/source-extension-react.tsx`
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/image-generation-node-properties-panel/sources/use-connected-sources.ts`
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/query-node-properties-panel/sources/use-connected-sources.ts`
