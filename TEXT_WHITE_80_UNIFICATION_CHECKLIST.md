# text-white/80 → text-inverse/80 統一後の確認ページリスト

## 📋 今回変更されたファイル

以下の5ファイルで`text-white/80`を`text-inverse/80`に統一しました：

1. `field.tsx` - `placeholder:text-white/30` → `placeholder:text-inverse/30`
2. `repository-item.tsx` - プロファイル名表示
3. `account-display-name-form.tsx` - Editボタン
4. `button.tsx` - primary variant
5. `github-authentication.tsx` - Connect/Disconnectボタン（2箇所）
6. `google-authentication.tsx` - Connect/Disconnectボタン（2箇所）

## 🔴 確認すべきページ（優先度順）

### 1. `/settings/account/general` - Account General Page

**変更内容:**
- `Field`コンポーネント（Email addressフィールド）
- `AccountDisplayNameForm`のEditボタン

**確認ポイント:**
- [ ] Email addressフィールドのプレースホルダーが正しく表示されているか（`text-inverse/30`）
- [ ] Display Nameセクションの「Edit」ボタンのテキスト色が正しく表示されているか（`text-inverse/80`）
- [ ] ボタンのホバー効果が正常に動作するか

### 2. `/settings/account/authentication` - Authentication Page

**変更内容:**
- GitHub認証のConnect/Disconnectボタン
- Google認証のConnect/Disconnectボタン

**確認ポイント:**
- [ ] GitHub認証カードの「Connect」ボタンのテキスト色が正しく表示されているか（未接続時）
- [ ] GitHub認証カードの「Disconnect」ボタンのテキスト色が正しく表示されているか（接続時）
- [ ] Google認証カードの「Connect」ボタンのテキスト色が正しく表示されているか（未接続時）
- [ ] Google認証カードの「Disconnect」ボタンのテキスト色が正しく表示されているか（接続時）
- [ ] すべてのボタンのテキスト色が`text-inverse/80`（半透明の白）で統一されているか
- [ ] ボタンのホバー効果が正常に動作するか

### 3. `/settings/team/vector-stores` - Vector Stores Page (GitHub)

**変更内容:**
- `RepositoryItem`のプロファイル名表示

**確認ポイント:**
- [ ] リポジトリカード内のEmbedding Profile名が正しく表示されているか（`text-inverse/80`）
- [ ] プロファイル名のテキスト色が統一されているか

### 4. その他のページ（`Button`コンポーネント使用箇所）

**変更内容:**
- `button.tsx`の`primary` variantのテキスト色

**確認ポイント:**
- [ ] `/settings`配下のすべてのページで、`variant="primary"`のボタンが正しく表示されているか
- [ ] ボタンのテキスト色が`text-inverse/80`で統一されているか

## 📝 変更の詳細

**統一内容:**
- `text-white/80` → `text-inverse/80`（ボタンテキスト、プロファイル名）
- `text-white/30` → `text-inverse/30`（プレースホルダー）

**影響範囲:**
- `/settings`配下のすべてのページ（`Button`コンポーネントを使用している箇所）
- `/settings/account/general`（`Field`コンポーネント）
- `/settings/account/authentication`（GitHub/Google認証ボタン）
- `/settings/team/vector-stores`（リポジトリカード）

## ✅ 確認完了状況

- [x] `/settings`配下の`text-white-*/text-black-*`の統一完了
- [x] すべてのリンターエラーなし
- [ ] 視覚確認（上記ページ）

## ⚠️ 注意事項

- `text-inverse/80`は`text-white/80`と同じ見た目になるはずですが、セマンティックトークンを使用することで将来的な変更に対応しやすくなります
- ボタンのホバー効果やフォーカス状態も確認してください

