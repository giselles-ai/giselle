- [ ] `workspace-slice`: Workspaceの低レベル状態 + API を集約（XYFlow向けUI state含む）
  - [x] `addNode(node, ui?)`
  - [x] `updateNode(nodeId, data)` / `updateNodeData(node, data)` / `updateNodeDataContent(node, content)`
  - [x] `deleteNode(nodeId)`（関連connection削除 + 非Action Operation nodeのinputs掃除 + ui.nodeState掃除）
  - [x] `addConnection({ outputNode, outputId, inputNode, inputId })`（ConnectionId生成して追加）
  - [x] `deleteConnection(connectionId)`（非Action Operation nodeのinputs掃除）
  - [x] `setUiNodeState(nodeId, partialUi)`
  - [x] `setUiViewport(viewport, { save? })`（必要なら `_skipNextSave` 連携）
  - [x] `selectConnection(connectionId)` / `deselectConnection(connectionId)`
  - [x] `updateFileStatus(nodeId, filesOrUpdater)`（file node の content.files を更新）
- [ ] `app-slice`: Workspace派生の低レベル selector / utility
  - [x] `hasStartNode()`
  - [x] `hasEndNode()`
  - [x] `isStartNodeConnectedToEndNode()`
- [ ] `persistence`: `_skipNextSave` 等の store 状態と連携（必要なら）
  - [x] `_skipNextSave` を subscribe 側でリセットして無視
- [ ] `external deps`: 外部I/O依存を注入（テスト可能に）
  - [x] `GiselleClientProvider`（usecaseから `useGiselle()` で参照）


