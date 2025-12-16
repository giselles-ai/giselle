- [ ] XYFlowイベントを “ユースケースAPI” にまとめる（UIからは usecase だけ呼ぶ）
  - [x] `useConnectNodes()`（`@xyflow/react` の `onConnect` 相当）
  - [x] `useIsValidConnection()`（`isValidConnection` 相当 / 重複防止）
  - [x] `useApplyNodesChange()`（`onNodesChange` 相当: position/dimensions/select/remove）
  - [x] `useApplyEdgesChange()`（`onEdgesChange` 相当: select/remove）
  - [x] `useSelectSingleNode()`（node click: 1つだけ選択）
  - [x] `useClearSelection()`（pane click: 全選択解除）
  - [x] `useSetViewport()`（`onMoveEnd` 相当）
- [ ] File I/O（`GiselleClientProvider` + `useGiselle()` で参照）
  - [x] `useUploadFile()`（client: `useGiselle()`, workspaceId: `useAppDesignerStore((s)=>s.id)`）
  - [x] `useRemoveFile()`（同上）
  - [x] `useCopyFiles()`（同上）
- [ ] アプリ固有のユースケース（必要なら）
  - [ ] AppEntry node auto-configure（`zustand-bridge-provider` の `autoConfigureAppEntryNode` 相当）
  - [ ] App connected/disconnected sync（reachable end node判定→保存）


