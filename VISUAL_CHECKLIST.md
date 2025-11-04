# 目視確認すべきページリスト

## ✅ 変更したダイアログの確認ページ

### 1. InviteMemberDialog（メンバー招待ダイアログ）
**確認ページ:** `/settings/team/members`
**確認方法:**
1. Settings → Team → Members にアクセス
2. 「Invite Member」ボタンをクリック
3. ダイアログが開くことを確認
4. **確認ポイント:**
   - タイトル「Invite Team Member」が `text-inverse` で表示されているか
   - クローズボタン（X）が `text-inverse` で表示されているか
   - 説明文が `text-text-muted` で表示されているか
   - 入力フィールドのプレースホルダーが `text-inverse/30` で表示されているか
   - メールタグのテキストが `text-inverse` で表示されているか
   - 削除ボタン（X）が `text-text/60` で表示され、hover時に `text-inverse` になるか

### 2. ProfileEditModal（プロフィール編集ダイアログ）
**確認ページ:** `/settings/account`
**確認方法:**
1. Settings → Account にアクセス
2. 「Your Display Name」セクションの編集ボタンをクリック
3. ダイアログが開くことを確認
4. **確認ポイント:**
   - タイトル「Edit Profile」が `text-inverse` で表示されているか
   - クローズボタン（X）が `text-inverse` で表示されているか
   - 説明文が `text-text-muted` で表示されているか
   - アバター画像のホバーオーバーレイ上のアイコンが `text-inverse` で表示されているか
   - 入力フィールドのテキストが `text-inverse` で表示されているか
   - プレースホルダーが `text-inverse/30` で表示されているか

### 3. TeamProfileEditModal（チームプロフィール編集ダイアログ）
**確認ページ:** `/settings/team`
**確認方法:**
1. Settings → Team → General にアクセス
2. チームプロフィールカードの編集ボタンをクリック
3. ダイアログが開くことを確認
4. **確認ポイント:**
   - タイトル「Edit Team Profile」が `text-inverse` で表示されているか
   - クローズボタン（X）が `text-inverse` で表示されているか
   - 説明文が `text-text-muted` で表示されているか
   - アバター画像のホバーオーバーレイ上のアイコンが `text-inverse` で表示されているか

### 4. ConfigureSourcesDialog（ベクトルストア設定ダイアログ）
**確認ページ:** `/settings/team/vector-stores`
**確認方法:**
1. Settings → Team → Vector Stores にアクセス
2. 登録済みリポジトリの「Configure」ボタンをクリック
3. ダイアログが開くことを確認
4. **確認ポイント:**
   - タイトル「Configure Vector Stores」が `text-inverse` で表示されているか
   - クローズボタン（X）が `text-inverse` で表示されているか
   - 説明文が `text-text-muted` で表示されているか

### 5. RepositoryRegistrationDialog（リポジトリ登録ダイアログ）
**確認ページ:** `/settings/team/vector-stores`
**確認方法:**
1. Settings → Team → Vector Stores にアクセス
2. 「Register GitHub Repository」ボタンをクリック
3. ダイアログが開くことを確認
4. **確認ポイント:**
   - タイトル「Register GitHub Repository」が `text-inverse` で表示されているか
   - クローズボタン（X）が `text-inverse` で表示されているか
   - 説明文が `text-text-muted` で表示されているか

### 6. AgentUsageDialog（エージェント使用ログダイアログ）
**確認ページ:** `/settings/team/usage`
**確認方法:**
1. Settings → Team → Usage にアクセス
2. 「View All Logs」ボタンをクリック
3. ダイアログが開くことを確認
4. **確認ポイント:**
   - タイトル「App Usage Logs」が `text-inverse` で表示されているか

## 📋 確認チェックリスト

### 各ダイアログで確認すべき共通項目

- [ ] ダイアログが正常に開くか
- [ ] タイトルが正しい色（`text-inverse`）で表示されているか
- [ ] クローズボタン（X）が正しい色（`text-inverse`）で表示されているか
- [ ] 説明文が正しい色（`text-text-muted`）で表示されているか
- [ ] ホバー時の色変化が正しく動作するか
- [ ] フォーカス時の色変化が正しく動作するか
- [ ] プレースホルダーが正しい色（`text-inverse/30`）で表示されているか
- [ ] アイコンが正しい色（`text-inverse`）で表示されているか
- [ ] 補助テキストが正しい色（`text-text/60`）で表示されているか

### ブラウザ環境での確認

**推奨ブラウザ:**
- Chrome/Edge（最新版）
- Safari（最新版）
- Firefox（最新版）

**確認時の注意点:**
- ダークモード/ライトモードの確認（現在はライトモード想定）
- 異なる画面サイズでの確認（レスポンシブ対応）
- スクロール可能なダイアログの確認

## 🎯 優先度

### 高優先度（必須確認）
1. ✅ InviteMemberDialog - `/settings/team/members`
2. ✅ ProfileEditModal - `/settings/account`
3. ✅ TeamProfileEditModal - `/settings/team`

### 中優先度（推奨確認）
4. ✅ ConfigureSourcesDialog - `/settings/team/vector-stores`
5. ✅ RepositoryRegistrationDialog - `/settings/team/vector-stores`

### 低優先度（必要に応じて確認）
6. ✅ AgentUsageDialog - `/settings/team/usage`

## 📝 確認後の報告項目

各ダイアログの確認後、以下を報告してください：

- **問題なし**: すべての項目が正常に動作している
- **軽微な問題**: 色の表示に問題があるが、機能は正常
- **重大な問題**: ダイアログが開かない、または表示が崩れている

問題が見つかった場合は、以下を記載してください：
- どのページで問題が発生したか
- どのダイアログで問題が発生したか
- 問題の詳細（スクリーンショットがあれば最適）
- 再現手順

