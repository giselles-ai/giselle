# bg-inverse置換後の視覚確認チェックリスト

## Settingsページ

### 1. `/settings/account`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/account/account-display-name-form.tsx`
- **確認項目**: 
  - 表示名編集ボタンのホバー背景（`bg-inverse/5` → `bg-[color-mix(...)]`）

### 2. `/settings/team`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-card.tsx`
- **確認項目**: 
  - チーム名編集ボタンのホバー背景（`bg-inverse/5` → `bg-[color-mix(...)]`）

### 3. `/settings/team/invite`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/invite-member-dialog.tsx`
- **確認項目**: 
  - メールアドレス入力フィールドの背景（`bg-inverse/5`）
  - メールタグの背景（`bg-inverse/10`）

### 4. `/settings/components/profile-edit-modal`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/components/profile-edit-modal.tsx`
- **確認項目**: 
  - 表示名入力フィールドの背景（`bg-inverse/5`）

### 5. `/settings/team/team-profile-edit-modal`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-edit-modal.tsx`
- **確認項目**: 
  - チーム名入力フィールドの背景（`bg-inverse/5`）

### 6. `/settings/team/vector-stores`
- **ファイル**: 
  - `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/repository-registration-dialog.tsx`
  - `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/configure-sources-dialog.tsx`
- **確認項目**: 
  - Code ConfigurationとPull Requests Configurationの背景（`bg-inverse/5`）
  - プロファイル選択のホバー背景（`hover:bg-inverse/5`）

### 7. `/settings/team/integrations/github`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/integrations/github-integration.tsx`
- **確認項目**: 
  - 区切り線の背景（`bg-inverse/10`）

## Workspacesページ

### 8. `/workspaces`
- **ファイル**: 
  - `apps/studio.giselles.ai/app/(main)/workspaces/components/search-header.tsx`
  - `apps/studio.giselles.ai/app/(main)/workspaces/components/app-thumbnail.tsx`
- **確認項目**: 
  - グリッド/リストビューボタンのアクティブ背景（`bg-inverse/10`）
  - アプリサムネイルの背景（`bg-inverse/5`）

## Authページ

### 9. `/join/[token]/signup`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/join/[token]/signup/form.tsx`
- **確認項目**: 
  - 入力フィールドの背景（`bg-inverse/10`）

### 10. `/join/[token]/login`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/join/[token]/login/form.tsx`
- **確認項目**: 
  - パスワード入力フィールドの背景（`bg-inverse/10`）

### 11. `/password_reset`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/password_reset/form.tsx`
- **確認項目**: 
  - メール入力フィールドの背景（`bg-inverse/10`）

### 12. `/password_reset/new_password`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/password_reset/new_password/form.tsx`
- **確認項目**: 
  - パスワード入力フィールドの背景（`bg-inverse/10`）

### 13. Auth共通フォーム
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/components/form.tsx`
- **確認項目**: 
  - メール/パスワード入力フィールドの背景（`bg-inverse/10`）

## UIコンポーネント

### 14. DropdownMenu
- **ファイル**: `apps/studio.giselles.ai/components/ui/dropdown-menu.tsx`
- **確認項目**: 
  - フォーカス/オープン時の背景（`focus:bg-inverse/5`, `data-[state=open]:bg-inverse/5`）

### 15. InviteMemberDialog (UI package)
- **ファイル**: `internal-packages/ui/components/invite-member-dialog.tsx`
- **確認項目**: 
  - メール入力コンテナの背景（`bg-inverse/5`）
  - メールタグの背景（`bg-inverse/10`）

### 16. RoleMenu
- **ファイル**: `internal-packages/ui/components/role-menu.tsx`
- **確認項目**: 
  - ボタンの背景とホバー（`bg-inverse/5`, `hover:bg-inverse/10`）
  - 区切り線の背景（`bg-inverse/10`）

### 17. IconBox
- **ファイル**: `internal-packages/ui/components/icon-box.tsx`
- **確認項目**: 
  - ホバー/フォーカス時の背景（`hover:bg-inverse/10`, `focus-visible:bg-inverse/10`）

### 18. Toggle
- **ファイル**: `internal-packages/ui/components/toggle.tsx`
- **確認項目**: 
  - トグルスイッチの背景（`bg-inverse`）

### 19. PromptEditor
- **ファイル**: `internal-packages/ui/components/prompt-editor.tsx`
- **確認項目**: 
  - エディタの背景（`bg-inverse/10`）
  - 拡張ボタンの背景とホバー（`bg-inverse/10`, `hover:bg-inverse/20`）

## Workflow Designer UI

### 20. Properties Panel
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/properties-panel.tsx`
- **確認項目**: 
  - ノード名編集フィールドの背景（`bg-inverse/10`）

### 21. EditableText
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/editable-text.tsx`
- **確認項目**: 
  - 入力フィールドの背景とボーダー（`bg-inverse/5`, `border-inverse/20`, `focus:border-inverse/30`）

### 22. SelectRepository
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/select-repository.tsx`
- **確認項目**: 
  - ドロップダウンボタンの背景とホバー（`bg-inverse/5`, `hover:bg-inverse/10`）

### 23. GenerateCTAButton
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/generate-cta-button.tsx`
- **確認項目**: 
  - 空の状態のホバー背景（`hover:bg-inverse/5`）

### 24. Text Generation Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/index.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/generation-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/prompt-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/tools/tools-panel.tsx`
- **確認項目**: 
  - 生成パネルの背景（`bg-inverse/10`）
  - プロンプトパネルの背景（`bg-inverse/5`）
  - ツールバッジの背景（`bg-inverse/10`）
  - 最小化ボタンの背景（`bg-inverse`, `hover:bg-inverse/80`）

### 25. Image Generation Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/image-generation-node-properties-panel/index.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/image-generation-node-properties-panel/generation-panel.tsx`
- **確認項目**: 
  - 生成パネルの背景（`bg-inverse/10`）
  - 拡張ボタンの背景とホバー（`bg-inverse/10`, `hover:bg-inverse/20`）
  - 最小化ボタンの背景（`bg-inverse`, `hover:bg-inverse/80`）

### 26. Query Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/query-node-properties-panel/query-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/query-node-properties-panel/generation-panel.tsx`
- **確認項目**: 
  - エディタの背景（`bg-inverse/10`）
  - 生成パネルの背景（`bg-inverse/10`）
  - ボーダー（`border-inverse/20`）
  - 削除ボタンのホバー背景（`hover:bg-inverse/20`）

### 27. Text Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-node-properties-panel/index.tsx`
- **確認項目**: 
  - エディタの背景（`bg-inverse/10`）

### 28. Web Page Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/web-page-node-properties-panel/index.tsx`
- **確認項目**: 
  - URL入力フィールドの背景（`bg-inverse/10`）

### 29. File Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/file-node-properties-panel/file-panel.tsx`
- **確認項目**: 
  - ドロップゾーンの背景（`bg-inverse/5`）

### 30. Manual Trigger Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/manual-trigger/manual-trigger-properties-panel.tsx`
- **確認項目**: 
  - パラメータ名入力フィールドの背景（`bg-inverse/10`）

### 31. GitHub Trigger Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/github-trigger-properties-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/install-application.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/unauthorized.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/event-selection-step.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/ui/configured-views/github-trigger-configured-view.tsx`
- **確認項目**: 
  - Callsign入力フィールドの背景（`bg-inverse/10`）
  - イベント選択ボタンの背景とホバー（`bg-inverse/10`, `hover:bg-inverse/10`, `border-inverse/20`, `hover:border-inverse/30`）
  - インストール/認証ボタンのホバー背景（`hover:bg-inverse/5`）
  - トグルスイッチの背景（`bg-inverse/10`）

### 32. GitHub Action Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/action-node-properties-panel/github-action-properties-panel.tsx`
- **確認項目**: 
  - アクション選択ボタンの背景とホバー（`bg-inverse/10`, `hover:bg-inverse/10`, `border-inverse/20`, `hover:border-inverse/30`）

### 33. Chat Panel
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/chat/chat-panel.tsx`
- **確認項目**: 
  - タイピングインジケーターのドット背景（`bg-inverse`）

### 34. UI Components
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/ui/slider.tsx`
  - `internal-packages/workflow-designer-ui/src/ui/switch.tsx`
  - `internal-packages/workflow-designer-ui/src/ui/image-card.tsx`
  - `internal-packages/workflow-designer-ui/src/ui/generation-view.tsx`
- **確認項目**: 
  - スライダーの範囲とつまみの背景（`bg-inverse`）
  - スイッチのつまみの背景（`bg-inverse`）
  - 画像カードの背景（`bg-inverse/10`）
  - 生成ビューの背景（`bg-inverse/10`）

## 確認のポイント

1. **背景色の透明度が正しく表示されているか**
   - `/5` = 5%透明度
   - `/10` = 10%透明度
   - `/20` = 20%透明度
   - `/30` = 30%透明度
   - `/80` = 80%透明度

2. **ホバー/フォーカス時の背景変化が正しく動作しているか**

3. **ボーダーの透明度が正しく表示されているか**

4. **すべての置換が適用されているか（旧aliasが残っていないか）**

