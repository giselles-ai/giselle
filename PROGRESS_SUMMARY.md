# デザインスタイル整理 - 進捗まとめ

## ✅ 完了した作業

### Phase 1: ui/dialog統一済みダイアログの色統一

**対象ファイル（6ファイル）:**
1. ✅ `invite-member-dialog.tsx` - text-white-400/text-black-400 → text-inverse/text-text-muted に統一
2. ✅ `profile-edit-modal.tsx` - text-white-400/text-black-400/text-white-800 → text-inverse/text-text-muted/text-inverse に統一
3. ✅ `team-profile-edit-modal.tsx` - text-white-400/text-black-400/text-white-800 → text-inverse/text-text-muted/text-inverse に統一
4. ✅ `configure-sources-dialog.tsx` - text-white-400/text-black-400 → text-inverse/text-text-muted に統一
5. ✅ `repository-registration-dialog.tsx` - text-white-400/text-black-400 → text-inverse/text-text-muted に統一
6. ✅ `agent-usage-dialog.tsx` - text-white-400 → text-inverse に統一

**置換内容:**
- `text-white-400` → `text-inverse`（DialogTitle, DialogClose）
- `text-black-400` → `text-text-muted`（DialogDescription）
- `text-white-800` → `text-inverse`（アイコン）
- `text-black-300` → `text-text/60`（補助テキスト）
- `text-white-600` → `text-inverse`（hover状態）
- `text-white-400/60` → `text-inverse/60`（不透明度付き）
- `text-white/30` → `text-inverse/30`（プレースホルダー）

**結果:**
- ✅ 6ファイルで色統一完了
- ✅ リンターエラーなし
- ✅ Biomeフォーマット済み

## 📊 残存状況

### /settings配下の残存（63箇所、15ファイル）

**主な残存箇所:**
- `document-vector-store-item.tsx`（21箇所）
- `user-teams.tsx`（7箇所）
- `glass-dialog-content.tsx`（3箇所）- これはコンポーネント定義
- その他12ファイル

**次のステップ:**
1. `glass-dialog-content.tsx`の使用箇所を`ui/dialog`に統一後に色統一
2. 複雑なコンポーネント（`document-vector-store-item.tsx`等）は個別対応

## 🎯 次のアクション

### Phase 2: GlassDialogContent使用箇所の統一（優先度中）

**対象:**
- `glass-dialog-content.tsx`を使用している箇所を`ui/dialog`に統一
- 統一後に色統一

**見積:** 2-3PR

### Phase 3: その他の残存箇所（優先度低）

**対象:**
- `document-vector-store-item.tsx`等の複雑なコンポーネント
- 個別対応が必要な箇所

**見積:** 複数PRに分割

## 📝 置換マッピング（確定版）

| 現在 | 置換後 | 用途 |
|------|--------|------|
| `text-white-400` | `text-inverse` | ダイアログタイトル、クローズボタン |
| `text-black-400` | `text-text-muted` | ダイアログ説明文 |
| `text-white-800` | `text-inverse` | アイコン（ホバーオーバーレイ上） |
| `text-black-300` | `text-text/60` | 補助テキスト、ID表示 |
| `text-white-600` | `text-inverse` | hover状態 |
| `text-white-400/60` | `text-inverse/60` | 弱いテキスト |
| `text-white/30` | `text-inverse/30` | プレースホルダー |

