# 水平展開 - 確認すべきページリスト

## 変更内容

1. **SearchInputコンポーネントの適用**
   - `/settings/account/user-teams.tsx` - 独自の検索入力欄を `SearchInput` に置き換え
   - `/workspaces/components/search-header.tsx` - `Input` コンポーネントを `SearchInput` に置き換え

## 確認すべきページ

### 1. Settings > Account > Overview
**URL:** `/settings/account`

**確認項目:**
- ✅ チーム検索欄が `SearchInput` コンポーネントで表示されているか
- ✅ 検索入力欄のスタイルが統一されているか（アイコン、プレースホルダー、フォーカス状態）
- ✅ `placeholder:text-link-muted` が適用されているか
- ✅ 検索機能が正常に動作するか

**変更箇所:**
- `apps/studio.giselles.ai/app/(main)/settings/account/user-teams.tsx`
  - 独自の検索入力欄 → `SearchInput` コンポーネント

### 2. Workspaces（一覧ページ）
**URL:** `/workspaces`

**確認項目:**
- ✅ 検索入力欄が `SearchInput` コンポーネントで表示されているか
- ✅ 検索入力欄のスタイルが統一されているか（アイコン、プレースホルダー、フォーカス状態）
- ✅ `placeholder:text-link-muted` が適用されているか
- ✅ ソート機能（Selectコンポーネント）が正常に動作するか
- ✅ グリッド/リスト表示の切り替えが正常に動作するか
- ✅ 検索機能が正常に動作するか

**変更箇所:**
- `apps/studio.giselles.ai/app/(main)/workspaces/components/search-header.tsx`
  - `Input` コンポーネント → `SearchInput` コンポーネント

## 確認時のチェックポイント

### SearchInputコンポーネントの統一性
- [ ] 検索アイコンが左側に表示されているか
- [ ] プレースホルダーテキストの色が `text-link-muted` になっているか
- [ ] フォーカス時に適切なリングが表示されるか（`focus:ring-focused/40`）
- [ ] ホバー時に背景色が変化するか（`hover:bg-surface/10`）

### Selectコンポーネントの動作確認
- [ ] Selectコンポーネントが正常に開閉するか
- [ ] ホバー時に背景色が変化するか（`hover:bg-white/5`）
- [ ] 選択した値が正しく表示されるか

### レイアウトとスタイリング
- [ ] 検索入力欄とその他の要素の間隔が適切か
- [ ] レスポンシブデザインが正常に動作するか（モバイル/デスクトップ）
- [ ] 他のページとの一貫性が保たれているか

