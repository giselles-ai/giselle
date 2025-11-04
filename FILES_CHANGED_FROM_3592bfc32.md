# コミット3592bfc32以降に変更されたファイル確認チェックリスト

## 概要
コミット`3592bfc32`（`fix: Correct color-mix syntax in Tailwind arbitrary values`）で変更されたファイルのリストと、それらがどのページ/コンポーネントに対応しているかを確認するためのチェックリストです。

## 変更されたファイル（45ファイル）

### Settingsページ関連

#### `/settings/account`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/account/account-display-name-form.tsx`
- **確認項目**: 表示名編集ボタンのホバー背景（`bg-[color-mix(in srgb,var(--color-text-inverse, #fff) 5%,transparent)]`）

#### `/settings/components/profile-edit-modal`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/components/profile-edit-modal.tsx`
- **確認項目**: 表示名入力フィールドの背景

#### `/settings/team`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/invite-member-dialog.tsx`
- **確認項目**: メールアドレス入力フィールドとメールタグの背景

- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-card.tsx`
- **確認項目**: チーム名編集ボタンのホバー背景

- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-edit-modal.tsx`
- **確認項目**: チーム名入力フィールドの背景

#### `/settings/team/vector-stores`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/repository-registration-dialog.tsx`
- **確認項目**: Code ConfigurationとPull Requests Configurationの背景

- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/configure-sources-dialog.tsx`
- **確認項目**: ソース設定の背景とプロファイル選択のホバー背景

#### `/settings/team/integrations/github`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/settings/team/integrations/github-integration.tsx`
- **確認項目**: 区切り線の背景

### Workspacesページ関連

#### `/workspaces`
- **ファイル**: `apps/studio.giselles.ai/app/(main)/workspaces/components/search-header.tsx`
- **確認項目**: グリッド/リストビューボタンのアクティブ背景

- **ファイル**: `apps/studio.giselles.ai/app/(main)/workspaces/components/app-thumbnail.tsx`
- **確認項目**: アプリサムネイルの背景

### Authページ関連

#### `/join/[token]/signup`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/join/[token]/signup/form.tsx`
- **確認項目**: 入力フィールドの背景

#### `/join/[token]/login`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/join/[token]/login/form.tsx`
- **確認項目**: パスワード入力フィールドの背景

#### `/password_reset`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/password_reset/form.tsx`
- **確認項目**: メール入力フィールドの背景

#### `/password_reset/new_password`
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/password_reset/new_password/form.tsx`
- **確認項目**: パスワード入力フィールドの背景

#### Auth共通フォーム
- **ファイル**: `apps/studio.giselles.ai/app/(auth)/components/form.tsx`
- **確認項目**: メール/パスワード入力フィールドの背景

### UIコンポーネント

#### DropdownMenu
- **ファイル**: `apps/studio.giselles.ai/components/ui/dropdown-menu.tsx`
- **確認項目**: ドロップダウンメニューの背景

#### IconBox
- **ファイル**: `internal-packages/ui/components/icon-box.tsx`
- **確認項目**: アイコンボックスのホバー/フォーカス背景

#### InviteMemberDialog
- **ファイル**: `internal-packages/ui/components/invite-member-dialog.tsx`
- **確認項目**: メールアドレス入力フィールドとメールタグの背景

#### PromptEditor
- **ファイル**: `internal-packages/ui/components/prompt-editor.tsx`
- **確認項目**: エディタの背景と拡大ボタンの背景

#### RoleMenu
- **ファイル**: `internal-packages/ui/components/role-menu.tsx`
- **確認項目**: ロールメニューの背景と区切り線

### Workflow Designer UI関連

#### GitHub Action Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/action-node-properties-panel/github-action-properties-panel.tsx`
- **確認項目**: プロパティパネルの背景

#### File Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/file-node-properties-panel/file-panel.tsx`
- **確認項目**: ファイルパネルの背景

#### Image Generation Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/image-generation-node-properties-panel/generation-panel.tsx`
- **確認項目**: 生成パネルの背景と拡大ボタン

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/image-generation-node-properties-panel/index.tsx`
- **確認項目**: インデックスの背景

#### Query Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/query-node-properties-panel/generation-panel.tsx`
- **確認項目**: 生成パネルの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/query-node-properties-panel/query-panel.tsx`
- **確認項目**: クエリパネルの背景とデータソースの背景

#### Text Generation Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/generation-panel.tsx`
- **確認項目**: 生成パネルの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/index.tsx`
- **確認項目**: インデックスの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/prompt-panel.tsx`
- **確認項目**: プロンプトパネルの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/tools/tools-panel.tsx`
- **確認項目**: ツールパネルの背景

#### Text Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-node-properties-panel/index.tsx`
- **確認項目**: テキストノードの背景

#### GitHub Trigger Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/event-selection-step.tsx`
- **確認項目**: イベント選択ステップの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/install-application.tsx`
- **確認項目**: インストールアプリケーションの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/components/unauthorized.tsx`
- **確認項目**: 未認証メッセージの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/github-trigger-properties-panel.tsx`
- **確認項目**: GitHubトリガープロパティパネルの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/ui/configured-views/github-trigger-configured-view.tsx`
- **確認項目**: 設定済みビューの背景

#### Manual Trigger Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/manual-trigger/manual-trigger-properties-panel.tsx`
- **確認項目**: マニュアルトリガープロパティパネルの背景

#### Workflow Designer UI共通コンポーネント
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/editable-text.tsx`
- **確認項目**: 編集可能テキストの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/generate-cta-button.tsx`
- **確認項目**: 生成CTAボタンの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/properties-panel.tsx`
- **確認項目**: プロパティパネルの背景

- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/select-repository.tsx`
- **確認項目**: リポジトリ選択の背景

#### Web Page Node
- **ファイル**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/web-page-node-properties-panel/index.tsx`
- **確認項目**: Webページノードの背景

#### Generation View
- **ファイル**: `internal-packages/workflow-designer-ui/src/ui/generation-view.tsx`
- **確認項目**: 生成ビューの背景

#### Image Card
- **ファイル**: `internal-packages/workflow-designer-ui/src/ui/image-card.tsx`
- **確認項目**: イメージカードの背景

## 確認のポイント

1. **構文が正しいか**
   - `bg-[color-mix(in srgb,var(--color-text-inverse, #fff) 5%,transparent)]`
   - `in srgb`（スペースが必要）
   - `var(...) 5%`（var()とパーセントの間にスペースが必要）

2. **背景色が正しく表示されているか**
   - `/5` = 5%透明度
   - `/10` = 10%透明度
   - `/20` = 20%透明度
   - `/80` = 80%透明度

3. **ホバー/フォーカス時の背景変化が正しく動作しているか**

4. **`aliases.css`に`bg-inverse`の定義がないことを確認**
   - 現在の`aliases.css`は`c9f0a7eb8`の状態（`bg-inverse`の定義なし）

## 次のステップ

これらのファイルを`3592bfc32`の状態に戻し、`bg-inverse/5`などのクラスを`bg-[color-mix(...)]`に置き換える必要があります。

