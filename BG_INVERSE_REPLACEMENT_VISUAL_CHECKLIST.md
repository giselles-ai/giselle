# bg-inverse置換後の視覚確認チェックリスト

## ⚠️ 現在の状態

すべての`bg-inverse`系のaliasを`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) X%, transparent)]`に置換しました。

**重要**: `bg-[color-mix(...)]`が効かない問題があります。原因を調査中です。
- Tailwindの任意値構文が`color-mix()`を正しく処理していない可能性
- CSS変数の解決タイミングの問題
- ブラウザのサポートの問題

現在、一部のファイルで構文エラー（`in_srgb` → `in srgb`、`var(...)_5%` → `var(...) 5%`）が残っています。これらを修正する必要があります。

**注意**: `aliases.css`から一時的な`bg-inverse/5`クラスを削除しました。`bg-[color-mix(...)]`が動作するようになるまで、代替手段を検討中です。

## Settingsページ

### 1. `/settings/account`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/account/account-display-name-form.tsx`
- **確認項目**: 
  - 表示名編集ボタンのホバー背景（`bg-[color-mix(...)]`使用、**構文エラーあり: `in_srgb` → `in srgb`、`_5%` → ` 5%`を修正が必要**）
  - **⚠️ 現在動作していない可能性あり**

### 2. `/settings/team`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-card.tsx`
- **確認項目**: 
  - チーム名編集ボタンのホバー背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）

### 3. `/settings/team/invite`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/invite-member-dialog.tsx`
- **確認項目**: 
  - メールアドレス入力フィールドの背景（`bg-[color-mix(...)]`使用）
  - メールタグの背景（`bg-[color-mix(...)]`使用）
  - **⚠️ 現在動作していない可能性あり**

### 4. `/settings/components/profile-edit-modal`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/components/profile-edit-modal.tsx`
- **確認項目**: 
  - 表示名入力フィールドの背景（`bg-[color-mix(...)]`使用、**構文エラーあり: `in_srgb` → `in srgb`、`_5%` → ` 5%`を修正が必要**）
  - **⚠️ 現在動作していない可能性あり**

### 5. `/settings/team/team-profile-edit-modal`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-edit-modal.tsx`
- **確認項目**: 
  - チーム名入力フィールドの背景（`bg-[color-mix(...)]`使用、**構文エラーあり: `in_srgb` → `in srgb`、`_5%` → ` 5%`を修正が必要**）
  - **⚠️ 現在動作していない可能性あり**

### 6. `/settings/team/vector-stores`
- **ファイル**: 
  - `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/repository-registration-dialog.tsx`
  - `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/configure-sources-dialog.tsx`
- **確認項目**: 
  - Code ConfigurationとPull Requests Configurationの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）
  - プロファイル選択のホバー背景（`hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）

### 7. `/settings/team/integrations/github`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/integrations/github-integration.tsx`
- **確認項目**: 
  - 区切り線の背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

## Workspacesページ

### 8. `/workspaces`
- **ファイル**: 
  - `apps/studio.giselles.ai/app/(main)/workspaces/components/search-header.tsx`
  - `apps/studio.giselles.ai/app/(main)/workspaces/components/app-thumbnail.tsx`
- **確認項目**: 
  - グリッド/リストビューボタンのアクティブ背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - アプリサムネイルの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）

## Authページ

### 9. `/join/[token]/signup`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/join/[token]/signup/form.tsx`
- **確認項目**: 
  - 入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 10. `/join/[token]/login`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/join/[token]/login/form.tsx`
- **確認項目**: 
  - パスワード入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 11. `/password_reset`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/password_reset/form.tsx`
- **確認項目**: 
  - メール入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 12. `/password_reset/new_password`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/password_reset/new_password/form.tsx`
- **確認項目**: 
  - パスワード入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 13. Auth共通フォーム
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/components/form.tsx`
- **確認項目**: 
  - メール/パスワード入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

## UIコンポーネント

### 14. DropdownMenu
- **ファイル**: `apps/studio.giselles.ai/components/ui/dropdown-menu.tsx`
- **確認項目**: 
  - フォーカス/オープン時の背景（`focus:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`, `data-[state=open]:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）

### 15. InviteMemberDialog (UI package)
- **ファイル**: `internal-packages/ui/components/invite-member-dialog.tsx`
- **確認項目**: 
  - メール入力コンテナの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）
  - メールタグの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 16. RoleMenu
- **ファイル**: `internal-packages/ui/components/role-menu.tsx`
- **確認項目**: 
  - ボタンの背景とホバー（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - 区切り線の背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 17. IconBox
- **ファイル**: `internal-packages/ui/components/icon-box.tsx`
- **確認項目**: 
  - ホバー/フォーカス時の背景（`hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`, `focus-visible:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 18. Toggle
- **ファイル**: `internal-packages/ui/components/toggle.tsx`
- **確認項目**: 
  - トグルスイッチの背景（`bg-[var(--color-text-inverse, #fff)]`）

### 19. PromptEditor
- **ファイル**: `internal-packages/ui/components/prompt-editor.tsx`
- **確認項目**: 
  - エディタの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - 拡張ボタンの背景とホバー（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`）

## Workflow Designer UI

### 20. Properties Panel
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/properties-panel.tsx`
- **確認項目**: 
  - ノード名編集フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 21. EditableText
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/editable-text.tsx`
- **確認項目**: 
  - 入力フィールドの背景とボーダー（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`, `border-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`, `focus:border-[color-mix(in srgb, var(--color-text-inverse, #fff) 30%, transparent)]`）

### 22. SelectRepository
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/select-repository.tsx`
- **確認項目**: 
  - ドロップダウンボタンの背景とホバー（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 23. GenerateCTAButton
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/generate-cta-button.tsx`
- **確認項目**: 
  - 空の状態のホバー背景（`hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）

### 24. Text Generation Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/index.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/generation-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/prompt-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/tools/tools-panel.tsx`
- **確認項目**: 
  - 生成パネルの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - プロンプトパネルの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）
  - ツールバッジの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - 最小化ボタンの背景（`bg-[var(--color-text-inverse, #fff)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 80%, transparent)]`）

### 25. Image Generation Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/image-generation-node-properties-panel/index.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/image-generation-node-properties-panel/generation-panel.tsx`
- **確認項目**: 
  - 生成パネルの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - 拡張ボタンの背景とホバー（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`）
  - 最小化ボタンの背景（`bg-[var(--color-text-inverse, #fff)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 80%, transparent)]`）

### 26. Query Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/query-node-properties-panel/query-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/query-node-properties-panel/generation-panel.tsx`
- **確認項目**: 
  - エディタの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - 生成パネルの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - ボーダー（`border-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`）
  - 削除ボタンのホバー背景（`hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`）

### 27. Text Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-node-properties-panel/index.tsx`
- **確認項目**: 
  - エディタの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 28. Web Page Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/web-page-node-properties-panel/index.tsx`
- **確認項目**: 
  - URL入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 29. File Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/file-node-properties-panel/file-panel.tsx`
- **確認項目**: 
  - ドロップゾーンの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）

### 30. Manual Trigger Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/manual-trigger/manual-trigger-properties-panel.tsx`
- **確認項目**: 
  - パラメータ名入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 31. GitHub Trigger Node
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/github-trigger-properties-panel.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/install-application.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/unauthorized.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/event-selection-step.tsx`
  - `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/ui/configured-views/github-trigger-configured-view.tsx`
- **確認項目**: 
  - Callsign入力フィールドの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - イベント選択ボタンの背景とホバー（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`, `border-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`, `hover:border-[color-mix(in srgb, var(--color-text-inverse, #fff) 30%, transparent)]`）
  - インストール/認証ボタンのホバー背景（`hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`）
  - トグルスイッチの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

### 32. GitHub Action Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/action-node-properties-panel/github-action-properties-panel.tsx`
- **確認項目**: 
  - アクション選択ボタンの背景とホバー（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`, `hover:bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`, `border-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`, `hover:border-[color-mix(in srgb, var(--color-text-inverse, #fff) 30%, transparent)]`）

### 33. Chat Panel
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/chat/chat-panel.tsx`
- **確認項目**: 
  - タイピングインジケーターのドット背景（`bg-[var(--color-text-inverse, #fff)]`）

### 34. UI Components
- **ファイル**: 
  - `internal-packages/workflow-designer-ui/src/ui/slider.tsx`
  - `internal-packages/workflow-designer-ui/src/ui/switch.tsx`
  - `internal-packages/workflow-designer-ui/src/ui/image-card.tsx`
  - `internal-packages/workflow-designer-ui/src/ui/generation-view.tsx`
- **確認項目**: 
  - スライダーの範囲とつまみの背景（`bg-[var(--color-text-inverse, #fff)]`）
  - スイッチのつまみの背景（`bg-[var(--color-text-inverse, #fff)]`）
  - 画像カードの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）
  - 生成ビューの背景（`bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`）

## 確認のポイント

1. **背景色の透明度が正しく表示されているか**
   - `/5` = 5%透明度 → `bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`
   - `/10` = 10%透明度 → `bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`
   - **⚠️ 現在、`bg-[color-mix(...)]`が効かない問題があります。視覚確認では背景が黒または透明になっている可能性があります。**
   - `/20` = 20%透明度 → `bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`
   - `/30` = 30%透明度 → `bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 30%, transparent)]`
   - `/80` = 80%透明度 → `bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 80%, transparent)]`
   - 透明度なし → `bg-[var(--color-text-inverse, #fff)]`

2. **ホバー/フォーカス時の背景変化が正しく動作しているか**

3. **ボーダーの透明度が正しく表示されているか**
   - `border-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`

4. **すべての置換が適用されているか（旧aliasが残っていないか）**

## 置換パターン

### 現在の状態
- すべての`bg-inverse`系を`bg-[color-mix(...)]`に置換済み
- **⚠️ しかし、`bg-[color-mix(...)]`が効かない問題が発生中**

### 正しい構文（修正が必要）
- `bg-inverse/5` → `bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)]`
  - ❌ `in_srgb` (間違い)
  - ✅ `in srgb` (正しい)
  - ❌ `var(...)_5%` (間違い)
  - ✅ `var(...) 5%` (正しい)

- `bg-inverse/10` → `bg-[color-mix(in srgb, var(--color-text-inverse, #fff) 10%, transparent)]`
- `bg-inverse` (透明度なし) → `bg-[var(--color-text-inverse, #fff)]`
- `border-inverse/20` → `border-[color-mix(in srgb, var(--color-text-inverse, #fff) 20%, transparent)]`

### 問題の原因調査中
1. Tailwindの任意値構文が`color-mix()`を正しく処理していない可能性
2. CSS変数の解決タイミングの問題
3. ブラウザのサポートの問題

**注意**: 構文エラーを修正しても動作しない場合は、別のアプローチ（例: `aliases.css`での定義、インラインスタイル）を検討する必要があります。

**注意**: `color-mix()`の構文ではスペースが必要です：
- ✅ `in srgb` (正しい)
- ❌ `in_srgb` (間違い)

また、`var()`とパーセンテージの間にもスペースが必要です：
- ✅ `var(--color-text-inverse, #fff) 5%` (正しい)
- ❌ `var(--color-text-inverse, #fff)_5%` (間違い)

