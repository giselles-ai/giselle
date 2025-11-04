# 変更内容の確認ページリスト

## 📋 確認すべきページ（優先度順）

### 🔴 高優先度（必須確認）

#### 1. `/settings/account` - Account Overview
**変更内容:**
- `Card` コンポーネント（タイトル/説明文の色）
- `UserTeams` コンポーネント（検索アイコン、チーム名、ロール、ドロップダウンメニュー）
- `ProfileEditModal` ダイアログ（Display Name編集ボタンから開く）

**確認ポイント:**
- [ ] Cardのタイトルが `text-inverse` で表示されているか
- [ ] Cardの説明文が `text-text-muted` で表示されているか
- [ ] 検索アイコンが `text-text-muted` で表示されているか
- [ ] チーム名が `text-inverse` で表示されているか
- [ ] ロールが `text-text-muted` で表示されているか
- [ ] ドロップダウンメニューのアイコンが `text-text/60` で表示されているか
- [ ] ドロップダウンメニューの項目が `text-inverse` で表示されているか
- [ ] ProfileEditModalのタイトル/説明文が正しい色で表示されているか

#### 2. `/settings/account/general` - Account General
**変更内容:**
- `Card` コンポーネント（タイトル/説明文の色）
- `AccountDisplayNameForm`（Display Name、説明文）

**確認ポイント:**
- [ ] Cardのタイトルが `text-inverse` で表示されているか
- [ ] Cardの説明文が `text-text-muted` で表示されているか
- [ ] Display Nameのタイトルが `text-inverse` で表示されているか
- [ ] 説明文が `text-text-muted` で表示されているか

#### 3. `/settings/account/authentication` - Authentication
**変更内容:**
- `GitHubAuthenticationPresentation`（GitHubアイコン、名前、説明文）
- `GoogleAuthenticationPresentation`（Googleアイコン、名前、説明文）

**確認ポイント:**
- [ ] GitHubカードのアイコンが `text-inverse` で表示されているか
- [ ] GitHubカードの名前が `text-inverse` で表示されているか
- [ ] GitHubカードの説明文が `text-text-muted` で表示されているか
- [ ] Googleカードのアイコンが `text-inverse` で表示されているか
- [ ] Googleカードの名前が `text-inverse` で表示されているか
- [ ] Googleカードの説明文が `text-text-muted` で表示されているか

#### 4. `/settings/team` - Team Settings
**変更内容:**
- `Card` コンポーネント（Billing情報）
- `TeamProfileCard` → `TeamProfileEditModal`（編集ボタンから開く）
- `TeamPage` の Free Plan 表示

**確認ポイント:**
- [ ] Cardのタイトルが `text-inverse` で表示されているか
- [ ] Cardの説明文が `text-text-muted` で表示されているか
- [ ] Free Planのタイトルが `text-inverse` で表示されているか
- [ ] TeamProfileEditModalのタイトル/説明文が正しい色で表示されているか

#### 5. `/settings/team/members` - Team Members
**変更内容:**
- `Card` コンポーネント（複数箇所）
- `InviteMemberDialog`（「Invite Member」ボタンから開く）
- `InvitationListItem`（招待リスト、ロール、ドロップダウンメニュー）

**確認ポイント:**
- [ ] Cardのタイトルが `text-inverse` で表示されているか
- [ ] Cardの説明文が `text-text-muted` で表示されているか
- [ ] InviteMemberDialogのタイトル/説明文が正しい色で表示されているか
- [ ] 招待リストのロールが `text-inverse` で表示されているか
- [ ] 招待リストの説明文が `text-text-muted` で表示されているか
- [ ] ドロップダウンメニューの項目が `text-inverse` で表示されているか

### 🟡 中優先度（推奨確認）

#### 6. `/settings/team/vector-stores` - Vector Stores (GitHub)
**変更内容:**
- `RepositoryRegistrationDialog`（「Register GitHub Repository」ボタンから開く）
- `RepositoryItem`（各リポジトリカード、ステータス表示）
- `ConfigureSourcesDialog`（リポジトリの「Configure」ボタンから開く）
- `DiagnosticModal`（診断ボタンから開く）

**確認ポイント:**
- [ ] RepositoryRegistrationDialogのタイトル/説明文が正しい色で表示されているか
- [ ] RepositoryItemのステータス表示が `text-text-muted` で表示されているか
- [ ] ConfigureSourcesDialogのタイトル/説明文が正しい色で表示されているか
- [ ] DiagnosticModalのタイトル/説明文が正しい色で表示されているか

#### 7. `/settings/team/vector-stores/document` - Vector Stores (Document)
**注意**: `docVectorStoreFlag()` が有効な場合のみ表示されます。フラグが無効の場合は `notFound()` が返されます。

**アクセス方法:**
- `/settings/team/vector-stores` ページのサイドバーから「Document」タブをクリック
- または直接 `/settings/team/vector-stores/document` にアクセス（フラグが有効な場合のみ）

**変更内容:**
- `DocumentVectorStoreCreateDialog`（「New Vector Store」ボタンから開く）
- `DocumentVectorStoreItem`（各ベクトルストアカード、設定ダイアログ）

**確認ポイント:**
- [ ] DocumentVectorStoreCreateDialogのタイトル/説明文が正しい色で表示されているか
- [ ] DocumentVectorStoreItemのタイトルが `text-inverse` で表示されているか
- [ ] DocumentVectorStoreItemのIDが `text-text/60` で表示されているか
- [ ] 設定ダイアログのタイトル/説明文が正しい色で表示されているか
- [ ] ファイルアップロードエリアのテキストが正しい色で表示されているか

### 🟢 低優先度（必要に応じて確認）

#### 8. `/settings/team/usage` - Team Usage
**変更内容:**
- `Card` コンポーネント（Recent App Usage）
- `AgentUsageDialog`（「View All Logs」ボタンから開く）
- `AgentUsageTable`（テーブルヘッダー、行、空状態）
- `AgentTimeUsage`（使用時間表示）

**確認ポイント:**
- [ ] Cardのタイトルが `text-inverse` で表示されているか
- [ ] AgentUsageDialogのタイトルが `text-inverse` で表示されているか
- [ ] AgentUsageTableのヘッダーが `text-inverse` で表示されているか
- [ ] AgentUsageTableの行が `text-inverse` で表示されているか
- [ ] 空状態のメッセージが `text-text-muted` で表示されているか
- [ ] AgentTimeUsageの使用時間表示が `text-inverse` で表示されているか

## 📝 確認チェックリスト（共通）

各ページで確認すべき共通項目：

- [ ] **タイトル**: `text-inverse`（白色）
- [ ] **説明文**: `text-text-muted`（グレー）
- [ ] **補助テキスト**: `text-text/60`（薄いグレー）
- [ ] **アイコン**: `text-inverse` または `text-text/60`（用途に応じて）
- [ ] **プレースホルダー**: `text-inverse/30` または `text-text-muted`（半透明）
- [ ] **ホバー時の色変化**: 正常に動作するか
- [ ] **フォーカス時の色変化**: 正常に動作するか

## 🎯 優先度別の確認順序

1. **まず確認**: `/settings/account`, `/settings/account/general`, `/settings/account/authentication`
2. **次に確認**: `/settings/team`, `/settings/team/members`
3. **最後に確認**: `/settings/team/vector-stores`, `/settings/team/vector-stores/document`（フラグが有効な場合のみ）, `/settings/team/usage`

## 🔄 最新の変更（glass-dialog-content.tsx → ui/dialog 統一）

### 変更されたダイアログコンポーネント

以下のダイアログが `@giselle-internal/ui/dialog` に統一されました：

1. **DiagnosticModal** - リポジトリ接続診断ダイアログ
2. **DocumentVectorStoreCreateDialog** - ドキュメントベクターストア作成ダイアログ
3. **DuplicateAgentButton** - ワークスペース複製確認ダイアログ
4. **DeleteAgentButton** - ワークスペース削除確認ダイアログ（destructive）
5. **DeleteTeam** - チーム削除確認ダイアログ（destructive）
6. **RepositoryItem Delete Dialog** - リポジトリ削除確認ダイアログ（destructive）
7. **DocumentVectorStoreItem Configure Dialog** - ドキュメントベクターストア設定ダイアログ
8. **DocumentVectorStoreItem Delete Dialog** - ドキュメントベクターストア削除確認ダイアログ（destructive）

### 🔴 必須確認ページ（ダイアログ統一）

#### 9. `/settings/team/vector-stores` - Vector Stores (GitHub)
**変更内容:**
- `DiagnosticModal`（リポジトリカードの「Check」ボタンから開く）
- `RepositoryItem` の削除ダイアログ（リポジトリカードのメニューから「Delete」を選択）

**確認ポイント:**
- [ ] DiagnosticModalが正しく表示されるか
  - [ ] タイトル「Checking Repository Access」が `text-inverse` で表示されているか
  - [ ] 説明文が `text-text-muted` で表示されているか
  - [ ] 閉じるボタン（X）が `text-inverse` で表示されているか
  - [ ] 診断結果の表示が正しいか（接続復元可能/アクセス不可）
  - [ ] ボタン（Cancel/Restore Connection/Delete Repository）が正しく表示されているか
  - [ ] ローディング状態が正しく表示されるか
- [ ] リポジトリ削除ダイアログが正しく表示されるか（destructive variant）
  - [ ] タイトル「Delete Repository」が `text-error-900` で表示されているか
  - [ ] 説明文が `text-error-900/50` で表示されているか
  - [ ] ガラス背景と赤いボーダーが正しく表示されているか
  - [ ] ボタン（Cancel/Delete）が正しく表示されているか

#### 10. `/settings/team/vector-stores/document` - Vector Stores (Document)
**変更内容:**
- `DocumentVectorStoreCreateDialog`（「New Vector Store」ボタンから開く）
- `DocumentVectorStoreItem` の設定ダイアログ（各カードの「Configure」ボタンから開く）
- `DocumentVectorStoreItem` の削除ダイアログ（各カードのメニューから「Delete」を選択）

**確認ポイント:**
- [ ] DocumentVectorStoreCreateDialogが正しく表示されるか
  - [ ] タイトル「Create Vector Store」が `text-inverse` で表示されているか
  - [ ] 説明文が `text-text-muted` で表示されているか
  - [ ] フォームフィールドが正しく表示されているか
  - [ ] Embedding Modelsの選択UIが正しく表示されているか
  - [ ] ボタン（Cancel/Create）が正しく表示されているか
- [ ] DocumentVectorStoreItem設定ダイアログが正しく表示されるか
  - [ ] タイトル「Configure Sources」が `text-inverse` で表示されているか
  - [ ] 説明文が `text-text-muted` で表示されているか
  - [ ] ファイルアップロードエリアが正しく表示されているか
  - [ ] ボタン（Cancel/Save）が正しく表示されているか
  - [ ] スクロールが正常に動作するか（コンテンツが多い場合）
- [ ] DocumentVectorStoreItem削除ダイアログが正しく表示されるか（destructive variant）
  - [ ] タイトル「Delete Document Vector Store」が `text-error-900` で表示されているか
  - [ ] 説明文が `text-error-900/50` で表示されているか
  - [ ] ガラス背景と赤いボーダーが正しく表示されているか
  - [ ] ボタン（Cancel/Delete）が正しく表示されているか

#### 11. `/settings/team` - Team Settings
**変更内容:**
- `DeleteTeam` コンポーネントの削除確認ダイアログ（destructive variant）

**確認ポイント:**
- [ ] DeleteTeam削除ダイアログが正しく表示されるか（destructive variant）
  - [ ] タイトル「Delete Team」が `text-error-900` で表示されているか
  - [ ] 説明文が `text-error-900/50` で表示されているか
  - [ ] ガラス背景と赤いボーダーが正しく表示されているか
  - [ ] エラーメッセージが正しく表示されるか（エラーがある場合）
  - [ ] ボタン（Cancel/Delete Team）が正しく表示されているか
  - [ ] フォーム送信が正常に動作するか

#### 12. `/workspaces` - Workspaces List
**変更内容:**
- `DuplicateAgentButton` の複製確認ダイアログ
- `DeleteAgentButton` の削除確認ダイアログ（destructive variant）

**確認ポイント:**
- [ ] DuplicateAgentButton複製ダイアログが正しく表示されるか
  - [ ] タイトル「Duplicate "Workspace Name"?」が `text-inverse` で表示されているか
  - [ ] 説明文が `text-text-muted` で表示されているか
  - [ ] ボタン（Cancel/Duplicate）が正しく表示されているか
  - [ ] ローディング状態が正しく表示されるか
- [ ] DeleteAgentButton削除ダイアログが正しく表示されるか（destructive variant）
  - [ ] タイトル「Delete Workspace」が `text-error-900` で表示されているか
  - [ ] 説明文が `text-error-900/50` で表示されているか
  - [ ] ガラス背景と赤いボーダーが正しく表示されているか
  - [ ] ボタン（Cancel/Delete）が正しく表示されているか
  - [ ] ローディング状態が正しく表示されるか

### 🔍 ダイアログ統一の確認ポイント（共通）

すべてのダイアログで確認すべき項目：

- [ ] **ガラス背景**: `variant="glass"` のダイアログはガラス背景が正しく表示されているか
- [ ] **デストラクティブスタイル**: `variant="destructive"` のダイアログは赤いボーダーと背景が正しく表示されているか
- [ ] **オーバーレイ**: ダイアログ背景のオーバーレイが適切な透明度で表示されているか（`rgba(0, 0, 0, 0.3)`）
- [ ] **タイトル**: `text-inverse` または `text-error-900`（destructive）で表示されているか
- [ ] **説明文**: `text-text-muted` または `text-error-900/50`（destructive）で表示されているか
- [ ] **閉じるボタン**: Xアイコンが `text-inverse` で表示されているか
- [ ] **ボタン**: Cancel/Confirmボタンが正しいスタイルで表示されているか
- [ ] **スクロール**: DialogBodyのコンテンツがスクロール可能か（コンテンツが多い場合）
- [ ] **フォーカス**: キーボードナビゲーションが正常に動作するか
- [ ] **ESCキー**: ESCキーでダイアログが閉じるか
- [ ] **背景クリック**: 背景クリックでダイアログが閉じるか（必要な場合）

## ⚠️ 特に注意すべき点

- **ダイアログ**: すべてガラス背景なので、`text-inverse` が正しく表示されるか確認
- **Cardコンポーネント**: 複数のページで使用されているため、すべてのページで統一されているか確認
- **ドロップダウンメニュー**: ホバー時の色変化が正常に動作するか確認
- **空状態**: リストが空の場合のメッセージが正しく表示されるか確認
- **Destructiveダイアログ**: 削除確認ダイアログは赤いボーダーと背景が正しく表示されるか確認
- **スクロール**: DialogBodyのコンテンツが多い場合、スクロールが正常に動作するか確認

