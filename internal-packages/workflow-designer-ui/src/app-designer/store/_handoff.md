# App Designer Store Refactor / Migration Handoff

目的: `internal-packages/workflow-designer-ui/src/editor/**` が依存している `@giselles-ai/react` の `useWorkflowDesigner()` / `useWorkflowDesignerStore()` を、`internal-packages/workflow-designer-ui/src/app-designer/store/**` の slice + usecases に段階的に置き換える。

このファイルは **「なにを、なぜそうしたか」「今どこまで終わっているか」「次に何をやるか」**の引き継ぎ用。

---

## 設計方針（重要）

- **Slice は atomic primitive のみ**
  - `workspace-slice` は `addNode/updateNode/removeNode/addConnection/removeConnection/setUiNodeState/setUiViewport/setSelectedConnectionIds/updateWorkspaceName/setCurrentShortcutScope` など最小単位だけを持つ
  - 複合操作（delete node + connection掃除、inputs掃除等）は **usecases** に寄せる

- **Usecase は “UI の意図（intent-unit）”**
  - XYFlow handlers、Copy/Paste/Duplicate、Secrets/WebPage、File I/O 等は usecase に集約

- **外部依存は注入（DI）**
  - `GiselleClient` は `GiselleClientProvider` を作り、usecase 側は `useGiselle()` を使う

- **LLM providers はロード usecase を作らない**
  - `llmProviders` は同期的に Provider から渡される前提
  - store 内で読み取り専用データとして保持し、`setLLMProviders`/`isLoading` は削除済み

- **命名: store の `id` は廃止し、公開APIを `workspaceId` に統一**
  - store を読む側で `id` が「storeId」っぽく見える問題を回避

---

## 現在の store 構成（app-designer）

- `internal-packages/workflow-designer-ui/src/app-designer/store/app-designer-store.ts`
  - `createAppDesignerStore({ initialWorkspace, llmProviders })`
  - state: `WorkspaceSlice & AppSlice & UiSlice`

- `workspace-slice`
  - `Workspace.id` は store 上は `workspaceId` として公開
  - 永続対象: `name/nodes/connections/ui/schemaVersion`
  - `_skipNextSave` による persistence の save 抑制がある

- `ui-slice`
  - `clipboardNode`
  - `llmProviders`（読み取り専用・初期注入）

- `persistence/controller.ts`
  - 保存 payload の `id` は `state.workspaceId` から作る

---

## `useWorkflowDesigner` の API サーフェス（参考: @giselles-ai/react）

定義: `packages/react/src/workspace/types.ts` の `WorkflowDesignerContextValue`
主要メンバー:
- `data: Workspace`
- `updateName`
- `updateNodeData/updateNodeDataContent`
- `deleteNode/deleteConnection/addConnection`
- `uploadFile/removeFile/copyFiles`
- `llmProviders`
- `copiedNode/setCopiedNode`
- `setCurrentShortcutScope`
- etc

---

## 置き換えチェックリスト（migration todo）

実ファイル: `internal-packages/workflow-designer-ui/src/app-designer/store/usecases/_migration-from-use-workflow-designer.md`

この todo は **usecase単位 + ファイル単位**でチェックを入れて進める。

---

## すでに完了した置き換え（editor 側）

※ migration todo にも `[x]` 反映済み

- `src/editor/v2/components/v2-header.tsx`
  - `useWorkflowDesigner().data/updateName` → `useAppDesignerStore` + `useUpdateWorkspaceName()`
  - `workspaceId` を利用

- `src/editor/tool/toolbar/toolbar.tsx`
  - `useWorkflowDesigner().llmProviders/data.nodes` → `useAppDesignerStore((s)=>({ llmProviders, nodes }))`

- Clipboard / context menu
  - `src/editor/node/use-node-manipulation.ts` → `useCopyNodeToClipboard/usePasteNodeFromClipboard/useDuplicateNode`
  - `src/editor/context-menu/index.tsx` → `useDeleteNode()`

- Shortcut scope gating
  - `src/editor/hooks/use-keyboard-shortcuts.ts`
    - `data.ui.currentShortcutScope` → `useAppDesignerStore((s)=>s.ui.currentShortcutScope)`

- Properties panel root
  - `src/editor/properties-panel/index.tsx`
    - selected nodes selector → `useAppDesignerStore`
    - focus/blur → `useSetCurrentShortcutScope()`

---

## 未着手・次にやる（おすすめ順）

### 1) 残っている `useWorkflowDesignerStore` の除去（局所的で安全）

grep で残存:
- `src/editor/properties-panel/text-generation-node-properties-panel/model/model-settings.tsx`
- `src/editor/properties-panel/text-generation-node-properties-panel-v2/node-context/use-node-context.ts`
- `src/editor/properties-panel/content-generation-node-properties-panel/node-context/use-node-context.ts`

→ いずれも `useAppDesignerStore` + app-designer usecases に置換する。

### 2) 各 Properties Panel の `useWorkflowDesigner()` を usecases に置換

基本はこの型:
- `updateNodeData` → `useUpdateNodeData()`
- `updateNodeDataContent` → `useUpdateNodeDataContent()`
- `deleteNode` → `useDeleteNode()`
- `deleteConnection` → `useDeleteConnection()`
- `workspaceId` → `useAppDesignerStore((s)=>s.workspaceId)`
- `connections/nodes` → `useAppDesignerStore((s)=>s.connections/nodes)`

### 3) Secrets / WebPage panels の “直 client 呼び” を usecase 化

editor 側はまだ `useGiselle`（@giselles-ai/react）で直接叩いている箇所があるので、
app-designer の usecases（`useAddSecret/useDeleteSecretAndCleanupNodes/useAddWebPages/useRemoveWebPage`）へ置換。

### 4) 最後に V2 canvas（`v2-container.tsx`）

ここは影響大なので最後に回す。
移行方針は:
- `useWorkflowDesignerStore + workspaceActions` の組を捨てる
- `useAppDesignerStore` selector + `useApplyNodesChange/useApplyEdgesChange/useConnectNodes/useIsValidConnection/useClearSelection/useSelectSingleNode/useSetViewport` へ置換

---

## 命名・規約メモ

- この repo では Biome が一部の `.md` を ignore する設定がある（`_migration-from-*.md` など）。
  - コードは Biome を必ず通す（`pnpm biome check --write <file>`）
  - md は手で整える方針でOK

---

## 主要ファイル一覧

### app-designer/store
- `store/app-designer-provider.tsx`（store provider + GiselleClientProvider）
- `store/giselle-client-provider.tsx`（DI）
- `store/app-designer-store.ts`（store composition）
- `store/slices/workspace-slice.ts`（workspaceId 化）
- `store/slices/ui-slice.ts`（clipboardNode + llmProviders）
- `store/usecases/index.ts`（usecase exports）
- `store/usecases/_migration-from-use-workflow-designer.md`（置き換え todo）

### editor（migration 対象）
- `editor/v2/components/v2-container.tsx`（最大の置換対象）
- `editor/properties-panel/**`（順次移行）
- `editor/secret/secret-table.tsx`（Secrets）
- `editor/properties-panel/web-page-node-properties-panel/index.tsx`（WebPage）


