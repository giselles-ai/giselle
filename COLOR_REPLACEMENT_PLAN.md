# デザインスタイル整理 - 現状分析とアクションプラン

## 📊 現状分析結果

### text-white-*/text-black-* の使用パターン（/settings配下）

**主要な使用パターン:**
1. **DialogTitle**: `text-white-400` - ダイアログタイトル（ガラス背景上）
2. **DialogClose**: `text-white-400` - クローズボタン（ガラス背景上）
3. **DialogDescription**: `text-black-400` - 説明文（ガラス背景上）
4. **アイコン**: `text-white-800` - ImageIcon等（ホバーオーバーレイ上）
5. **補助テキスト**: `text-black-300` - ID表示、プレースホルダー等
6. **hover状態**: `text-white-600` - hover時のテキスト色
7. **不透明度付き**: `text-white-400/60` - 弱いテキスト

**特徴:**
- すべて暗背景（ガラスダイアログ）上で使用
- パターンが明確で、安全に置換可能
- 既に`ui/dialog`に統一したダイアログが多数存在

## 🎯 アクションプラン

### Phase 1: ui/dialog統一済みダイアログの色統一（優先度高）

**対象:**
- `invite-member-dialog.tsx`
- `profile-edit-modal.tsx`
- `team-profile-edit-modal.tsx`
- `configure-sources-dialog.tsx`
- `repository-registration-dialog.tsx`
- `agent-usage-dialog.tsx`

**置換ルール:**
- `text-white-400` → `text-inverse`（DialogTitle, DialogClose）
- `text-black-400` → `text-text-muted`（DialogDescription）
- `text-white-800` → `text-inverse`（アイコン）
- `text-black-300` → `text-text/60`（補助テキスト）
- `text-white-600` → `text-inverse`（hover状態）
- `text-white-400/60` → `text-inverse/60`（不透明度付き）

**見積:** 1PR（~200行）

### Phase 2: GlassDialogContent使用箇所の統一（優先度中）

**対象:**
- `glass-dialog-content.tsx`自体（これはコンポーネント定義）
- `GlassDialogContent`を使用している箇所を`ui/dialog`に統一後に色統一

**見積:** 2-3PR（まず`ui/dialog`への統一、その後色統一）

### Phase 3: その他の残存箇所（優先度低）

**対象:**
- `document-vector-store-item.tsx`等の複雑なコンポーネント
- 個別対応が必要な箇所

**見積:** 複数PRに分割

## 📝 具体的な置換マッピング

### 安全置換可能（暗背景上・ガラスダイアログ）

| 現在 | 置換後 | 用途 |
|------|--------|------|
| `text-white-400` | `text-inverse` | ダイアログタイトル、クローズボタン |
| `text-black-400` | `text-text-muted` | ダイアログ説明文 |
| `text-white-800` | `text-inverse` | アイコン（ホバーオーバーレイ上） |
| `text-black-300` | `text-text/60` | 補助テキスト、ID表示 |
| `text-white-600` | `text-inverse` | hover状態 |
| `text-white-400/60` | `text-inverse/60` | 弱いテキスト |
| `text-white/30` | `text-inverse/30` | プレースホルダー |

### 要レビュー（背景依存）

- `text-white-*` が明るい背景上で使われている可能性がある箇所
- `text-black-*` が暗い背景上で使われている可能性がある箇所

## 🚀 次のステップ

1. **Phase 1を実行**（ui/dialog統一済みダイアログの色統一）
2. **dry-runで確認**してから適用
3. **小PRで分割**（1PR ~200行目安）

