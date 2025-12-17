- Goal: replace `@giselles-ai/react`’s `useWorkflowDesigner()` / `useWorkflowDesignerStore()` in `internal-packages/workflow-designer-ui/src/editor/**`
  with `internal-packages/workflow-designer-ui/src/app-designer/store/**` selectors + usecases.
  - v2-container itself is NOT replaced; only its internal store access is migrated.

---

## Preconditions (wiring)

- [ ] Ensure editor subtree is wrapped with `AppDesignerProvider` (and it receives `initialWorkspace`, `giselleClient`, `llmProviders`)
  - [ ] Replace `useGiselle` imports from `@giselles-ai/react` with `app-designer/store/useGiselle` where needed
  - [ ] Replace `useWorkflowDesignerStore` usage with `useAppDesignerStore` selectors

---

## Canonical API mapping (old -> new)

- **workspace data**
  - `useWorkflowDesigner().data` -> `useAppDesignerStore((s) => s)` (or scoped selectors: `s.nodes`, `s.connections`, `s.ui.nodeState`, `s.ui.viewport`, `s.workspaceId`, `s.name`)
- **workspace name**
  - `updateName(name)` -> `useUpdateWorkspaceName()`
- **node CRUD**
  - `addNode(node, { ui })` -> `useAddNode()(node, ui)`
  - `deleteNode(nodeId)` -> `useDeleteNode()(nodeId)` (async)
  - `copyNode(sourceNode, { ui, connectionCloneStrategy })` -> `useCopyNode()(sourceNode, { ui, connectionCloneStrategy })`
- **connections**
  - `addConnection({ outputNode, outputId, inputNode, inputId })` -> (XYFlow connect path) `useConnectNodes()` or `useAddConnection()` + `useUpdateNodeData()` composition
  - `deleteConnection(connectionId)` -> `useDeleteConnection()(connectionId)`
- **node updates**
  - `updateNodeData(node, patch)` -> `useUpdateNodeData()(node, patch)`
  - `updateNodeDataContent(node, patch)` -> `useUpdateNodeDataContent()(node, patch)`
- **XYFlow UI**
  - `setUiNodeState(nodeId, patch)` -> `useWorkspaceActions((a) => a.setUiNodeState)` (primitive)
  - `setUiViewport(viewport)` -> `useSetViewport()` (or primitive `setUiViewport`)
  - edge/node change handlers:
    - `onNodesChange` -> `useApplyNodesChange()`
    - `onEdgesChange` -> `useApplyEdgesChange()`
    - `onConnect` -> `useConnectNodes()`
    - `isValidConnection` -> `useIsValidConnection()`
    - selection:
      - node click -> `useSelectSingleNode()`
      - pane click -> `useClearSelection()`
      - edges select/remove handled via `useApplyEdgesChange()`
- **shortcut scope**
  - `setCurrentShortcutScope(scope)` -> `useSetCurrentShortcutScope()(scope)`
- **clipboard**
  - `copiedNode` -> `useAppDesignerStore((s) => s.clipboardNode)`
  - `setCopiedNode(node)` -> `useUiActions((a) => a.setClipboardNode)` or usecases:
    - `useCopyNodeToClipboard()`
    - `usePasteNodeFromClipboard()`
    - `useDuplicateNode()`
- **File I/O**
  - `uploadFile(files, node)` -> `useUploadFile()(files, node, options?)`
  - `removeFile(file)` -> `useRemoveFile()(file)`
  - `copyFiles(node)` -> `useCopyFiles()(node)`

---

## Replacement checklist (by feature/usecase)

### Workspace shell / canvas (XYFlow)

- [ ] `src/editor/v2/components/v2-container.tsx`
  - [ ] Replace `useWorkflowDesignerStore(...)` selectors with `useAppDesignerStore(...)`
  - [ ] Replace `workspaceActions` access with app-designer primitives + usecases:
    - [ ] `setUiNodeState` -> `useWorkspaceActions`
    - [ ] `setUiViewport` -> `useSetViewport()`
    - [ ] `setCurrentShortcutScope` -> `useSetCurrentShortcutScope()`
    - [ ] `updateNodeData` -> `useUpdateNodeData()`
    - [ ] `deleteNode` -> `useDeleteNode()`
    - [ ] `deleteConnection` -> `useDeleteConnection()`
    - [ ] `addNode` -> `useAddNode()`
    - [ ] connect logic (`createConnectionWithInput`, `isSupportedConnection`, `isValidConnection`) -> `useConnectNodes()` + `useIsValidConnection()`
    - [ ] selection (`selectConnection`/`deselectConnection`) -> `useApplyEdgesChange()` / `useSetSelectedConnectionIds()`
  - [ ] Prefer switching handlers to:
    - [ ] `onConnect` -> `useConnectNodes()`
    - [ ] `isValidConnection` -> `useIsValidConnection()`
    - [ ] `onNodesChange` -> `useApplyNodesChange()`
    - [ ] `onEdgesChange` -> `useApplyEdgesChange()`
    - [ ] `onNodeClick` -> `useSelectSingleNode()`
    - [ ] `onPaneClick` -> `useClearSelection()`

### Header / workspace name

- [x] `src/editor/v2/components/v2-header.tsx`
  - [x] `data.name` -> `useAppDesignerStore((s) => s.name)`
  - [x] `updateName` -> `useUpdateWorkspaceName()`

### Run button (highlight UI only)

- [ ] `src/editor/v2/components/run-button.tsx`
  - [ ] `data` -> `useAppDesignerStore((s) => ({ workspaceId: s.workspaceId, nodes: s.nodes, connections: s.connections }))`
  - [ ] `setUiNodeState` -> `useWorkspaceActions((a) => a.setUiNodeState)`

### Toolbar (LLM providers)

- [x] `src/editor/tool/toolbar/toolbar.tsx`
  - [x] `llmProviders` -> `useAppDesignerStore((s) => s.llmProviders)`
  - [x] `data: workspace` -> `useAppDesignerStore((s) => ({ nodes: s.nodes }))` (or `s.nodes`)

### Context menu / clipboard / duplicate

- [x] `src/editor/context-menu/index.tsx`
  - [x] `deleteNode` -> `useDeleteNode()`
  - [x] (after migrating `useNodeManipulation`) ensure it no longer relies on `useWorkflowDesigner`

- [x] `src/editor/node/use-node-manipulation.ts`
  - [x] Replace clipboard state + actions:
    - [x] `copiedNode/setCopiedNode` -> `clipboardNode/setClipboardNode` (or `useCopyNodeToClipboard`)
    - [x] `copyNode` -> `useCopyNode()`
    - [x] `paste` -> `usePasteNodeFromClipboard()`
    - [x] `duplicate` -> `useDuplicateNode()`
  - [x] `setUiNodeState` -> `useWorkspaceActions((a) => a.setUiNodeState)`
  - [x] `copyFiles` -> `useCopyFiles()`

### Keyboard shortcuts (scope gating)

- [x] `src/editor/hooks/use-keyboard-shortcuts.ts`
  - [x] `data.ui.currentShortcutScope` -> `useAppDesignerStore((s) => s.ui.currentShortcutScope)`

### Properties panel root (selection + focus)

- [ ] `src/editor/properties-panel/index.tsx`
  - [ ] selected node selection -> `useAppDesignerStore((s) => s.nodes.filter(...s.ui.nodeState...))`
  - [ ] `setCurrentShortcutScope` -> `useSetCurrentShortcutScope()`

### Node property panels: common (rename/delete)

- [ ] `src/editor/properties-panel/vector-store/index.tsx`
- [ ] `src/editor/properties-panel/trigger-node-properties-panel/index.tsx`
- [ ] `src/editor/properties-panel/file-node-properties-panel/index.tsx`
- [ ] `src/editor/properties-panel/text-node-properties-panel/index.tsx`
- [ ] `src/editor/properties-panel/query-node-properties-panel/index.tsx`
- [ ] `src/editor/properties-panel/image-generation-node-properties-panel/index.tsx`
  - [ ] `updateNodeData` -> `useUpdateNodeData()`
  - [ ] `deleteNode` -> `useDeleteNode()`
  - [ ] `data.id` (origin/workspaceId) -> `useAppDesignerStore((s) => s.workspaceId)`
  - [ ] `data.connections` -> `useAppDesignerStore((s) => s.connections)`

### Text generation (connections cleanup)

- [ ] `src/editor/properties-panel/text-generation-node-properties-panel/index.tsx`
- [ ] `src/editor/properties-panel/text-generation-node-properties-panel-v2/index.tsx`
  - [ ] `updateNodeData` -> `useUpdateNodeData()`
  - [ ] `updateNodeDataContent` -> `useUpdateNodeDataContent()`
  - [ ] `deleteNode` -> `useDeleteNode()`
  - [ ] `deleteConnection` -> `useDeleteConnection()` (and keep the “inputs cleanup” logic as-is or re-route through `useDeleteConnection` everywhere)

### Secrets

- [ ] `src/editor/secret/secret-table.tsx`
  - [ ] Replace manual `client.addSecret/deleteSecret + node cleanup` with:
    - [ ] `useAddSecret()`
    - [ ] `useDeleteSecretAndCleanupNodes()`
  - [ ] `workspace.id` -> `useAppDesignerStore((s) => s.workspaceId)`

### WebPage node

- [ ] `src/editor/properties-panel/web-page-node-properties-panel/index.tsx`
  - [ ] Replace inline add/remove logic with:
    - [ ] `useAddWebPages()`
    - [ ] `useRemoveWebPage()`
  - [ ] `workspaceId` -> `useAppDesignerStore((s) => s.workspaceId)`


