# aliases.css 使用状況調査レポート

調査日: 2024年現在
調査対象: `internal-packages/ui/styles/aliases.css`で定義されているクラスの使用状況

## 📊 使用状況サマリー

| クラスカテゴリ | 使用件数 | 使用ファイル数 | 主な用途 |
|--------------|---------|--------------|---------|
| `text-text` / `text-text/*` | 384件 | 125ファイル | 基本テキスト色 |
| `text-inverse` / `text-inverse/*` | 447件 | 104ファイル | 反転テキスト色（白） |
| `bg-surface` / `bg-bg` / `bg-inverse/*` | 230件 | 115ファイル | 背景色 |
| `border-border` / `border-border-muted` | 121件 | 68ファイル | ボーダー色 |
| `text-accent` / `bg-accent` / `border-accent` | 17件 | 12ファイル | アクセントカラー |
| `text-secondary` / `bg-secondary` / `prose-secondary` | 39件 | 22ファイル | セカンダリテキスト |

**合計**: 約1,200件以上の使用箇所、177ファイル以上

## 📁 主要な使用領域

### 1. Settings Pages (`apps/studio.giselles.ai/app/(main)/settings/`)
- Account settings
- Team settings
- Vector stores (GitHub/Document)
- Members management
- **使用クラス**: `text-text`, `text-inverse`, `bg-surface`, `bg-inverse/*`, `border-border`

### 2. Workflow Designer (`internal-packages/workflow-designer-ui/`)
- Properties panels
- Node components
- Toolbar
- **使用クラス**: `text-text`, `text-inverse`, `bg-surface`, `border-border-muted`

### 3. Auth Pages (`apps/studio.giselles.ai/app/(auth)/`)
- Signup/Login flows
- Password reset
- Team join
- **使用クラス**: `text-accent`, `bg-accent`, `text-secondary`, `prose-secondary`

### 4. UI Components (`internal-packages/ui/components/`)
- Dialog, Button, Select, Input
- Form fields, Tooltips
- **使用クラス**: `text-text`, `text-inverse`, `bg-surface`, `border-border`

### 5. Workspaces (`apps/studio.giselles.ai/app/(main)/workspaces/`)
- Workspace list
- Agent cards
- Search components
- **使用クラス**: `text-text`, `text-inverse`, `bg-surface`

## 🎯 定義されているクラス一覧

### Text Colors
- `text-text` - 基本テキスト色
- `text-text/20`, `text-text/40`, `text-text/60`, `text-text/80` - 透明度バリアント
- `text-inverse` - 反転テキスト色（白）
- `text-inverse/20`, `text-inverse/40`, `text-inverse/60`, `text-inverse/80` - 透明度バリアント
- `text-accent` - アクセントカラー
- `text-accent-muted` - ミュートアクセント
- `text-secondary` - セカンダリテキスト
- `text-link-muted` - リンクミュート
- `text-link-accent` - リンクアクセント
- `text-bg` - 背景色をテキスト色として使用
- `text-blue-light`, `text-blue-pale`, `text-blue-muted` - ブルーパレット

### Background Colors
- `bg-surface` - サーフェス背景
- `bg-bg` - 基本背景
- `bg-stage` - ステージ背景
- `bg-auth` - 認証ページ背景
- `bg-inverse` - 反転背景（白）
- `bg-inverse/5`, `bg-inverse/10`, `bg-inverse/15`, `bg-inverse/20`, `bg-inverse/30` - 透明度バリアント
- `bg-accent` - アクセント背景
- `bg-secondary` - セカンダリ背景
- `bg-chat-bubble-accent` - チャットバブル背景
- `bg-chat-bubble-user` - ユーザーバブル背景
- `bg-chat-input` - チャット入力背景
- `bg-blue-light`, `bg-blue-pale`, `bg-blue-muted` - ブルーパレット
- `bg-toolbar-gradient` - ツールバーグラデーション

### Border Colors
- `border-border` - 基本ボーダー
- `border-border-muted` - ミュートボーダー
- `border-accent` - アクセントボーダー
- `border-inverse` - 反転ボーダー
- `border-inverse/20` - 反転ボーダー（透明度）
- `border-chat-bubble-accent` - チャットバブルボーダー
- `border-chat-input` - チャット入力ボーダー
- `border-blue-light`, `border-blue-pale`, `border-blue-muted` - ブルーパレット

### Hover/Focus/Active Variants
- `hover:text-text`, `hover:text-inverse`, `hover:text-text/20`, `hover:text-text/40`, `hover:text-text/60`, `hover:text-text/80`
- `hover:text-inverse/20`, `hover:text-inverse/40`, `hover:text-inverse/60`, `hover:text-inverse/80`
- `hover:text-link-accent`, `hover:text-bg`, `hover:text-blue-pale`, `hover:text-auth-dark`
- `hover:bg-inverse/10`, `hover:bg-blue-pale`, `hover:bg-auth-dark`
- `hover:border-auth-dark`
- `focus:text-text`, `focus:text-inverse`, `focus-visible:bg-inverse/10`
- `active:text-text`, `active:text-inverse`, `active:bg-inverse/15`

### Other Utilities
- `prose-secondary` - セカンダリテキスト用コンテナ
- `fill-text`, `fill-auth-ambient`, `fill-auth-watermark` - SVG fill
- `stroke-border` - SVG stroke
- `ring-focused`, `ring-chat-input` - フォーカスリング
- `outline-focused` - アウトライン
- `placeholder:text-inverse/40`, `placeholder:text-link-muted` - プレースホルダー
- `nav-glow` - ナビゲーショングロー効果
- `hover:text-icon-hover`, `hover:fill-icon-hover` - アイコンホバー
- Layout utilities: `h-header`, `px-page`, `w-logo`

## 🔍 詳細分析

### 最も使用頻度の高いクラス

1. **`text-inverse`** (447件) - 最も広く使用されている
   - ダイアログ、カード、ボタンなどで頻繁に使用
   - 暗い背景上の白テキストに適用

2. **`text-text`** (384件) - 基本テキスト色として広く使用
   - フォーム、リスト、説明文などで使用

3. **`bg-surface`** / **`bg-bg`** / **`bg-inverse/*`** (230件)
   - 背景色として広く使用
   - カード、ダイアログ、入力フィールドなど

4. **`border-border`** / **`border-border-muted`** (121件)
   - ボーダーとして広く使用
   - 入力フィールド、カード、セパレーターなど

### 使用頻度の低いクラス（要検討）

1. **`text-secondary`** / **`bg-secondary`** / **`prose-secondary`** (39件)
   - 限定的な使用
   - セマンティックトークンへの移行検討が必要

2. **`text-accent`** / **`bg-accent`** / **`border-accent`** (17件)
   - 認証ページとナビゲーションで主に使用
   - 一部のUIコンポーネントでも使用

## 📝 次のステップ

### Phase 1: 高頻度クラスの確認
- [ ] `text-inverse`の使用箇所をレビュー（447件）
- [ ] `text-text`の使用箇所をレビュー（384件）
- [ ] `bg-surface` / `bg-bg`の使用箇所をレビュー（230件）

### Phase 2: 低頻度クラスの検討
- [ ] `text-secondary` / `prose-secondary`の代替案検討
- [ ] `text-accent`の使用箇所を確認し、semanticトークンへの移行可能性を検討

### Phase 3: 移行計画
- [ ] Tailwind v4のsemanticトークンへの移行計画
- [ ] `aliases.css`の段階的削除計画

## ⚠️ 注意事項

- `aliases.css`は現在、Tailwind v3からv4への移行期間中のブリッジとして機能
- すべてのクラスが`!important`を使用しているため、段階的な移行が必要
- 使用頻度の高いクラス（`text-inverse`, `text-text`）は、移行時に注意が必要

## 📈 統計

- **総使用箇所**: 約1,200件以上
- **総ファイル数**: 177ファイル以上
- **最も使用されているファイル**: 
  - `document/document-vector-store-item.tsx` (14件)
  - `repository-registration-dialog.tsx` (19件)
  - `github-action-properties-panel.tsx` (12件)
  - `toolbar.tsx` (20件)

