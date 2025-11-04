# 確認ページとチェック箇所（簡易版）

> ⚡ **5分で完了！** 最低限、このページだけ確認すればOKです。

---

## 🔴 必須確認（5分で完了）

### 1. **ヘッダー（全ページ共通）**
**URL**: どのページでもOK（例: `/` または `/workspaces`）

**確認箇所:**
- **右上のアバター**をクリック
  - ユーザー名（表示名）の色 → `text-inverse`（白っぽい色）
  - メールアドレスの色 → `text-text/60`（グレー）
  - メニュー項目（Account Settings, Create team, Home Page, Log Out）の色 → `text-inverse`
  - 「Create team」の「+」アイコンの色 → `text-bg`（背景色と同色）

- **ロゴ横のチーム選択ドロップダウン**をクリック
  - 現在のチーム名の色 → `text-inverse`
  - チームリストの各チーム名の色 → `text-inverse`
  - 「Create team」テキストの色 → `text-inverse`
  - 「Create team」の「+」アイコンの色 → `text-bg`

---

### 2. **Account Settings ページ**
**URL**: `/settings/account`

**確認箇所:**
- **「Create New Team」ボタン**をクリック → ダイアログが開く
  - ダイアログタイトル「Create New Team」の色 → `text-inverse`
  - 「Team Name」ラベルの色 → `text-inverse`
  - 入力欄のプレースホルダー「Enter team name」の色 → `text-text-muted`（グレー）
  - 「Select Plan」ラベルの色 → `text-inverse`
  - 「Free」「Pro」カードのタイトル色 → `text-inverse`
  - 価格（$0/month など）の色 → `text-inverse`
  - 説明文の色 → `text-text-muted`
  - 「Create Team」ボタンのテキスト色 → `text-inverse/80`（少し透明な白）

- **チームリストの「Free」タグ**
  - 「Free」テキストの色 → `text-inverse`
  - 「Free」タグのボーダー色 → `border-inverse`

---

### 3. **Workflow Designer（ワークフローエディタ）**
**URL**: `/workspaces/[workspaceId]`（任意のワークスペース）

**確認箇所:**

#### A. **テキスト生成ノード**
1. キャンバスに「Text Generation」ノードを追加
2. ノードを選択してプロパティパネルを開く
   - 空の状態メッセージの色 → `text-text-muted`
3. ノードを実行して生成結果を表示
   - 「Thinking」「Thinking Process」アコーディオンの色 → `text-inverse`
   - アコーディオンの内容の色 → `text-inverse`
   - 実行時間・トークン数の色 → `text-text-muted`

#### B. **ファイルノード**
1. 「File」ノードを追加して選択
   - アップロードエリアのアイコン色 → `text-text-muted`
   - 「Drop files here」テキストの色 → `text-inverse`
   - 「Max file size」テキストの色 → `text-text-muted`
   - 削除ボタン（ゴミ箱アイコン）の色 → `text-text-muted`、ホバー時 → `text-inverse`

#### C. **GitHub Triggerノード**
1. 「GitHub Trigger」ノードを追加して選択
   - リポジトリ選択時の「Private」「Public」バッジの色 → `text-text/60`
   - Callsignのコピーボタンの色 → `text-text-muted`、ホバー時 → `text-text/60`

#### D. **Run Button（右上の「Run」ボタン）**
1. 右上の「Run」ボタンをクリック
   - ダイアログ内の説明文の色 → `text-text-muted`

---

## 🟡 任意確認（時間があるときに）

### 4. **画像生成ノード**
- プロパティパネルの空の状態メッセージの色 → `text-text-muted`

### 5. **Web Pageノード**
- プロパティパネルのタイトルダイアログの色 → `text-inverse`

---

## 📋 確認チェックリスト（コピー用）

```
【ヘッダー】
□ 右上アバター → ユーザー名・メニュー項目が白っぽい色
□ 右上アバター → メールアドレスがグレー
□ 右上アバター → 「Create team」の「+」アイコンが背景色と同色
□ チーム選択 → チーム名が白っぽい色
□ チーム選択 → 「Create team」が白っぽい色

【Account Settings (/settings/account)】
□ 「Create New Team」ダイアログ → タイトル・ラベルが白っぽい色
□ 「Create New Team」ダイアログ → プレースホルダー・説明文がグレー
□ 「Create New Team」ダイアログ → ボタンテキストが少し透明な白
□ チームリスト → 「Free」タグが白っぽい色＋白っぽいボーダー

【Workflow Designer】
□ テキスト生成ノード → 空の状態メッセージがグレー
□ テキスト生成ノード → 生成結果のアコーディオンが白っぽい色
□ ファイルノード → アイコン・メッセージがグレー
□ GitHub Triggerノード → バッジ・ボタンがグレー
□ Run Button → 説明文がグレー
```

---

## 🎨 色の見分け方

- **`text-inverse`** = 白っぽい色（主要テキスト）
- **`text-text-muted`** = グレー（説明文・補助テキスト）
- **`text-text/60`** = 薄いグレー（メタ情報・アイコン）
- **`text-bg`** = 背景色と同色（見えにくい/透過的なアイコン）
- **`text-inverse/80`** = 少し透明な白（ボタンテキスト）

---

## 📋 詳細な変更内容（参考）

### 最新の変更内容（最新5コミット）

### 1. components/*エリアの色統一
- **`components/ui/button.tsx`**: `text-black-900` → `text-bg`
- **`components/free-tag.tsx`**: `text-white-400` → `text-inverse`, `border-white-400` → `border-inverse`

### 2. services/*エリアの色統一
- **`team-creation-form.tsx`**: チーム作成ダイアログ
  - `text-white/80` → `text-inverse/80` (ボタン)
  - `text-white-400` → `text-inverse` (タイトル、ラベル、カードタイトル)
  - `text-white-800` → `text-inverse` (入力ラベル、価格ラベル)
  - `text-black-400` → `text-text-muted` (プレースホルダー、説明文)
- **`user-button.tsx`**: ユーザーボタンのドロップダウンメニュー
  - `text-white-400` → `text-inverse` (メニュー項目)
  - `text-black-600` → `text-text/60` (メールアドレス)
  - `text-black-900` → `text-bg` (Plusアイコン)
- **`team-selection-form.tsx`**: チーム選択フォーム
  - `text-white-400` → `text-inverse` (チーム名、作成ボタン)
  - `text-black-900` → `text-bg` (Plusアイコン)
- **`team-selection.tsx`**: チーム選択コンポーネント
  - `text-white-400` → `text-inverse` (表示名、作成ボタン)
- **`sign-out-button.tsx`**: サインアウトボタン
  - `text-white-900` → `text-inverse`

### 3. workflow-designer-ui/*エリアの色統一
- **`editor/node/node.tsx`**: ノード表示
  - `text-black-400` → `text-text-muted` (完了ラベル、Inputラベル、未接続出力)
  - `text-black-900` → `text-bg` (コンテンツタイプアイコン)
  - `text-white-300` → `text-text/60` (メタデータセパレータ)
  - `text-white-400` → `text-inverse` (メタデータラベル)
- **`editor/properties-panel/file-node-properties-panel/file-panel.tsx`**: ファイルノードプロパティパネル
  - `text-black-300` → `text-text/60` (パネルベーステキスト)
  - `text-black-400` → `text-text-muted` (アイコン、アップロードメッセージ、削除ボタン)
- **`ui/generation-view.tsx`**: 生成結果表示
  - `text-black-400` → `text-text-muted` (スピナー)
  - `text-white-400` → `text-inverse` (アコーディオントリガー、コンテンツ)
  - `text-white-800` → `text-inverse` (ホバー状態)
  - `border-l-white-400/20` → `border-l-inverse/20`
- **その他多数のファイル**: properties-panel, empty-state, image-generation, trigger-input-dialog, web-page-node, query-result-view, select-repository, github-trigger関連など

## 🎯 確認すべきページ（優先度順）

### 🔴 高優先度（必須確認）

#### 1. **ヘッダー（全ページ）**
**変更コンポーネント:**
- `UserButton` (右上のアバター)
- `TeamSelection` (チーム選択ドロップダウン)

**確認ポイント:**
- [ ] ヘッダー右上のアバターをクリック
  - [ ] ドロップダウンメニューが開く
  - [ ] ユーザー名（表示名）が `text-inverse` で表示されているか
  - [ ] メールアドレスが `text-text/60` で表示されているか
  - [ ] メニュー項目（Account Settings, Create team, Home Page, Log Out）が `text-inverse` で表示されているか
  - [ ] Create teamボタンのPlusアイコンが `text-bg` で表示されているか
- [ ] チーム選択ドロップダウンをクリック
  - [ ] 現在のチーム名が `text-inverse` で表示されているか
  - [ ] チームリストの各チーム名が `text-inverse` で表示されているか
  - [ ] "Create team"オプションのテキストが `text-inverse` で表示されているか
  - [ ] Plusアイコンが `text-bg` で表示されているか

#### 2. `/settings/account` - Account Overview Page
**変更コンポーネント:**
- `TeamCreation` (Create New Teamボタン)
- `FreeTag` (Freeプラン表示)

**確認ポイント:**
- [ ] "Create New Team"ボタンをクリック
  - [ ] チーム作成ダイアログが開く
  - [ ] ダイアログのタイトル「Create New Team」が `text-inverse` で表示されているか
  - [ ] Closeボタンが `text-inverse` で表示されているか
  - [ ] Team Nameラベルが `text-inverse` で表示されているか
  - [ ] Team Name入力欄のプレースホルダーが `text-text-muted` で表示されているか
  - [ ] Select Planラベルが `text-inverse` で表示されているか
  - [ ] Free/Proカードのタイトルが `text-inverse` で表示されているか
  - [ ] 価格ラベル（$0/month, {proPlanPrice}/month）が `text-inverse` で表示されているか
  - [ ] 説明文が `text-text-muted` で表示されているか
  - [ ] Create Team/Proceed to Paymentボタンのテキストが `text-inverse/80` で表示されているか
- [ ] Freeプランのタグが `text-inverse` で表示されているか（`border-inverse` も確認）

#### 3. **Workflow Designer - 各種ノードのプロパティパネル**
**変更コンポーネント:**
- `editor/node/node.tsx`
- `editor/properties-panel/file-node-properties-panel/file-panel.tsx`
- `ui/generation-view.tsx`
- `editor/properties-panel/image-generation-node-properties-panel/generation-panel.tsx`
- `editor/properties-panel/ui/properties-panel.tsx`

**確認ポイント:**
- [ ] ワークフローエディタを開く
- [ ] **テキスト生成ノード**を選択
  - [ ] プロパティパネルの空の状態メッセージが `text-text-muted` で表示されているか
  - [ ] 生成完了後の使用量情報（実行時間、トークン数）が `text-text-muted` で表示されているか
  - [ ] 生成結果のアコーディオン（Thinking, Thinking Process）が `text-inverse` で表示されているか
  - [ ] アコーディオンのコンテンツが `text-inverse` で表示されているか
  - [ ] アコーディオンのボーダーが `border-l-inverse/20` で表示されているか
- [ ] **画像生成ノード**を選択
  - [ ] 空の状態メッセージが `text-text-muted` で表示されているか
- [ ] **ファイルノード**を選択
  - [ ] ファイルアップロードエリアのアイコンが `text-text-muted` で表示されているか
  - [ ] アップロード中のメッセージが `text-text-muted` で表示されているか
  - [ ] 削除ボタンが `text-text-muted` で表示され、ホバー時に `text-inverse` になるか
- [ ] **ノード**（任意のノード）
  - [ ] 完了ラベルが `text-text-muted` で表示されているか
  - [ ] メタデータラベルが `text-inverse` で表示されているか
  - [ ] Inputラベル（未接続時）が `text-text-muted` で表示されているか
  - [ ] Outputラベル（未接続時）が `text-text-muted` で表示されているか
- [ ] **プロパティパネルヘッダー**
  - [ ] ノードアイコンの色が適切に表示されているか（`text-bg` または `text-inverse`）

#### 4. **Workflow Designer - GitHub関連コンポーネント**
**変更コンポーネント:**
- `trigger-node-properties-panel/ui/configured-views/github-trigger-configured-view.tsx`
- `trigger-node-properties-panel/providers/github-trigger/github-trigger-properties-panel.tsx`
- `trigger-node-properties-panel/providers/github-trigger/components/unauthorized.tsx`
- `trigger-node-properties-panel/providers/github-trigger/components/install-application.tsx`
- `action-node-properties-panel/github-action-properties-panel.tsx`
- `editor/properties-panel/ui/select-repository.tsx`

**確認ポイント:**
- [ ] GitHub Triggerノードを選択
  - [ ] リポジトリ選択時のPrivate/Publicバッジが `text-text/60` で表示されているか
  - [ ] Callsignのクリップボードボタンが `text-text-muted` で表示され、ホバー時に `text-text/60` になるか
  - [ ] 未認証時のメッセージが `text-text/60` と `text-text-muted` で表示されているか
  - [ ] アプリインストール画面のメッセージが `text-text/60` と `text-text-muted` で表示されているか
- [ ] GitHub Actionノードを選択
  - [ ] リポジトリ選択時のPrivate/Publicバッジが `text-text/60` で表示されているか

#### 5. **Workflow Designer - その他のUIコンポーネント**
**変更コンポーネント:**
- `editor/v2/components/trigger-input-dialog/dialog.tsx`
- `editor/properties-panel/web-page-node-properties-panel/index.tsx`
- `ui/query-result-view.tsx`
- `ui/dropdown-menu.tsx`
- `editor/tool/toolbar/components/tooltip-and-hotkey.tsx`
- `ui/empty-state.tsx`

**確認ポイント:**
- [ ] Run Button (Trigger Input Dialog)を開く
  - [ ] 説明文が `text-text-muted` で表示されているか
- [ ] Web Pageノードを選択
  - [ ] ページタイトルダイアログのタイトルが `text-inverse` で表示されているか
  - [ ] Loadingメッセージが `text-inverse` で表示されているか
  - [ ] 削除ボタンが `text-text/60` で表示されているか
- [ ] Query Result Viewを表示
  - [ ] スピナーが `text-text-muted` で表示されているか
  - [ ] タブ（非アクティブ）が `text-text-muted` で表示されているか
- [ ] ドロップダウンメニューのラベルが `text-text-muted` で表示されているか
- [ ] ツールバーのツールチップのホットキーが `text-text-muted` で表示されているか
- [ ] EmptyStateコンポーネントのタイトルが `text-text/60`、説明文が `text-text-muted` で表示されているか

### 🟡 中優先度（視覚確認推奨）

#### 6. **FreeTagコンポーネントの表示**
**変更コンポーネント:**
- `components/free-tag.tsx`

**確認ポイント:**
- [ ] Freeプランが表示されている場所を確認
  - [ ] テキストが `text-inverse` で表示されているか
  - [ ] ボーダーが `border-inverse` で表示されているか

#### 7. **Buttonコンポーネントの表示**
**変更コンポーネント:**
- `components/ui/button.tsx`

**確認ポイント:**
- [ ] `components/ui/button` を使用している場所を確認
  - [ ] default variantのテキストが `text-bg` で表示されているか
  - [ ] link variantのホバー時のテキストが `text-bg` で表示されているか

## 🎨 色の統一マッピング

| 旧トークン | 新トークン | 主な使用箇所 |
|----------|----------|------------|
| `text-white-400` | `text-inverse` | 主要テキスト、アイコン、メニュー項目 |
| `text-black-400` | `text-text-muted` | 説明文、補助テキスト、ラベル |
| `text-white-800` | `text-inverse` | 強調テキスト、入力ラベル |
| `text-black-600` | `text-text/60` | 日時、メタ情報、アイコン |
| `text-white-600` | `text-text/60` | アイコン |
| `text-black-900` | `text-bg` | ボタンテキスト（背景が `bg-bg` の場合）、アイコン |
| `text-black-300` | `text-text/60` | アイコン、タイトル |
| `text-white-900` | `text-inverse` | ボタンテキスト |
| `text-white/80` | `text-inverse/80` | ボタンテキスト |
| `border-white-400` | `border-inverse` | ボーダー |
| `border-black-400` | `border-border/40` | ボーダー |
| `fill-black-300` | `fill-text/60` | SVGアイコン |
| `border-l-white-400/20` | `border-l-inverse/20` | アコーディオンの左ボーダー |

## 📝 確認時の注意事項

1. **ヘッダーの確認**
   - すべてのページのヘッダーで確認可能
   - ユーザーボタンとチーム選択は常に表示されている

2. **チーム作成ダイアログの確認**
   - `/settings/account` ページの「Create New Team」ボタンから開く
   - または、ヘッダーのチーム選択ドロップダウンから「Create team」を選択

3. **Workflow Designerの確認**
   - ワークフローエディタを開き、各種ノードを作成してプロパティパネルを確認
   - テキスト生成ノードは生成前と生成後の両方の状態を確認
   - GitHub関連ノードは認証状態によって表示が変わるため、両方の状態を確認

4. **視覚的整合性の確認**
   - 色の統一が適切に行われているか
   - コントラストが十分か
   - ホバー状態が正しく動作しているか

