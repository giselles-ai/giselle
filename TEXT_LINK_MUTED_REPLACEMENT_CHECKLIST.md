# text-link-muted 置換完了 - 視覚確認チェックリスト

## ✅ 完了した作業

### 置換内容
- ✅ ページ内での使用を置換（4ファイル）
  - `user-teams.tsx`
  - `profile-edit-modal.tsx`
  - `team-profile-edit-modal.tsx`
  - `invite-member-dialog.tsx`
- ✅ UIコンポーネント内の使用を置換（3ファイル）
  - `search-input.tsx`
  - `link-muted.tsx`
  - `docs-link.tsx`
- ✅ `aliases.css`から定義を削除

### 置換内容
- `placeholder:text-link-muted` → `placeholder:text-[var(--color-link-muted)]`
- `text-link-muted` → `text-[var(--color-link-muted)]`

---

## 🔍 視覚確認が必要なページ

### 1. `/settings/account` ページ
- [ ] **User Teams セクション**
  - 検索入力フィールドのプレースホルダー（`placeholder:text-link-muted`）
  - プレースホルダーテキストが正しく表示されているか確認

- [ ] **Edit Profile ダイアログ**
  - Display Name 入力フィールドのプレースホルダー（`placeholder:text-link-muted`）
  - プレースホルダーテキストが正しく表示されているか確認

### 2. `/settings/team` ページ
- [ ] **Edit Team Profile ダイアログ**
  - Team Name 入力フィールドのプレースホルダー（`placeholder:text-link-muted`）
  - プレースホルダーテキストが正しく表示されているか確認

- [ ] **Invite Team Member ダイアログ**
  - Email Addresses 入力フィールドのプレースホルダー（`placeholder:text-link-muted`）
  - プレースホルダーテキストが正しく表示されているか確認

### 3. `/workspaces` ページ
- [ ] **SearchInput コンポーネント**
  - 検索入力フィールドのプレースホルダー（`placeholder:text-link-muted`）
  - プレースホルダーテキストが正しく表示されているか確認

### 4. その他のページ
- [ ] **LinkMuted コンポーネントを使用しているすべてのページ**
  - リンクテキストの色が正しく表示されているか確認
  - ホバー時の動作が正しく動作しているか確認

- [x] **DocsLink コンポーネントを使用しているすべてのページ**
  - `tone="secondary"` の場合のリンクテキストの色が正しく表示されているか確認
  - ホバー時の動作が正しく動作しているか確認

---

## 📋 確認ポイント

1. **プレースホルダーテキストの色**
   - プレースホルダーテキストが適切な色で表示されているか
   - 以前と視覚的に同じか

2. **リンクテキストの色**
   - `text-link-muted`を使用しているリンクが適切な色で表示されているか
   - ホバー時の動作が正しく動作しているか

3. **フォーカス時の動作**
   - 入力フィールドにフォーカスした時の動作が正しいか

4. **ダークモード対応**
   - ダークモードでも正しく表示されているか（該当する場合）

---

## ⚠️ 注意事項

- UIコンポーネント（`search-input.tsx`, `link-muted.tsx`, `docs-link.tsx`）の変更は多くのページに影響するため、広範囲な視覚確認が必要です
- 特に`SearchInput`コンポーネントは多くのページで使用されているため、主要なページで確認してください

