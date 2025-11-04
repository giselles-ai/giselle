# 最新の変更（glass-dialog統一）確認ページリスト

## 📋 今回変更されたコンポーネント

以下の5つのコンポーネントが `@giselle-internal/ui/dialog` に統一されました：

1. **InvitationListItem** - 招待リストアイテム（削除ダイアログ）
2. **TeamMemberListItem** - チームメンバーリストアイテム（削除ダイアログ）
3. **ShowcaseClient** - Showcaseページ（プレイリスト作成ダイアログ）
4. **RevokeInvitationDialog** - 招待取り消しダイアログコンポーネント
5. **InviteMemberDialog** - メンバー招待ダイアログコンポーネント

## 🔴 必須確認ページ（優先度順）

### 1. `/settings/team/members` - Team Members Page

**変更内容:**
- `InviteMemberDialog` - 「Invite Member」ボタンから開くダイアログ
- `InvitationListItem` - 招待リストアイテム内の削除確認ダイアログ（destructive variant）
- `TeamMemberListItem` - チームメンバーリストアイテム内の削除確認ダイアログ（destructive variant）

**確認ポイント:**

#### InviteMemberDialog（ガラスダイアログ）
- [ ] ダイアログが正しく表示されるか
- [ ] タイトル「Invite Team Member」が `text-inverse` で表示されているか
- [ ] 説明文が `text-text-muted` で表示されているか（ある場合）
- [ ] 閉じるボタン（X）が `text-inverse` で表示されているか
- [ ] メールアドレス入力フィールドが正しく表示されているか
- [ ] メールタグ（追加されたメール）が正しく表示されているか
- [ ] ロール選択ドロップダウンが正しく表示されているか
- [ ] エラーメッセージが正しく表示されるか（無効なメールアドレスなど）
- [ ] ボタン（Cancel/Invite）が正しく表示されているか
- [ ] ローディング状態が正しく表示されるか
- [ ] フォーム送信が正常に動作するか

#### InvitationListItem 削除ダイアログ（destructive variant）
- [ ] 招待リストアイテムの「...」メニューから「Revoke invitation」を選択
- [ ] 削除確認ダイアログが正しく表示されるか
- [ ] タイトル「Revoke Invitation」が `text-error-900` で表示されているか
- [ ] 説明文が `text-error-900/50` で表示されているか
- [ ] ガラス背景と赤いボーダーが正しく表示されているか
- [ ] 閉じるボタン（X）が `text-inverse` で表示されているか
- [ ] ボタン（Cancel/Revoke）が正しく表示されているか
- [ ] ローディング状態が正しく表示されるか（Processing...）
- [ ] 削除が正常に動作するか

#### TeamMemberListItem 削除ダイアログ（destructive variant）
- [ ] チームメンバーリストアイテムのロール選択ドロップダウンから「Remove」を選択
- [ ] 削除確認ダイアログが正しく表示されるか
- [ ] タイトル「Remove Member」が `text-error-900` で表示されているか
- [ ] 説明文が `text-error-900/50` で表示されているか
- [ ] ガラス背景と赤いボーダーが正しく表示されているか
- [ ] 閉じるボタン（X）が `text-inverse` で表示されているか
- [ ] ボタン（Cancel/Remove）が正しく表示されているか
- [ ] ローディング状態が正しく表示されるか
- [ ] 削除が正常に動作するか

### 2. `/stage/showcase` - Showcase Page

**変更内容:**
- `ShowcaseClient` - プレイリスト作成ダイアログ（ガラスダイアログ）

**確認ポイント:**

#### プレイリスト作成ダイアログ（ガラスダイアログ）
- [ ] 「Playlist」タブを選択
- [ ] 「New Playlist +」ボタンをクリック
- [ ] ダイアログが正しく表示されるか
- [ ] タイトル「New Playlist Details」が `text-inverse` で表示されているか
- [ ] 説明文が `text-text-muted` で表示されているか
- [ ] 閉じるボタン（X）が `text-inverse` で表示されているか
- [ ] Title入力フィールドが正しく表示されているか
- [ ] Description入力フィールドが正しく表示されているか
- [ ] ボタン（Cancel/Save）が正しく表示されているか
- [ ] フォーム送信が正常に動作するか

### 3. その他の使用箇所

#### RevokeInvitationDialogコンポーネント
このコンポーネントは `internal-packages/ui/components/revoke-invitation-dialog.tsx` にありますが、現在のコードベースでは直接使用されていない可能性があります。もし他の場所で使用されている場合は、そのページでも確認してください。

**確認ポイント:**
- [ ] ダイアログが正しく表示されるか（`variant="destructive"` または `variant="default"`）
- [ ] タイトルが `text-error-900`（destructive）または `text-inverse`（default）で表示されているか
- [ ] 説明文が `text-error-900/50`（destructive）または `text-text-muted`（default）で表示されているか
- [ ] AlertTriangleアイコンが表示されるか（destructive variantの場合）
- [ ] エラーメッセージが正しく表示されるか（エラーがある場合）
- [ ] ボタン（Cancel/Revoke）が正しく表示されているか
- [ ] ローディング状態が正しく表示されるか

## 🔍 共通確認ポイント

すべてのダイアログで確認すべき項目：

### ガラスダイアログ（`variant="glass"`）
- [ ] **ガラス背景**: ガラス背景が正しく表示されているか
- [ ] **ぼかし効果**: `backdrop-blur-md` が適用されているか
- [ ] **ボーダー**: ボーダーが正しく表示されているか
- [ ] **トップハイライト**: 上部のハイライトが表示されているか
- [ ] **ベースフィル**: 背景の濃さが統一されているか（`withBaseFill={true}`）

### デストラクティブダイアログ（`variant="destructive"`）
- [ ] **赤いボーダー**: ボーダーが赤色（`border-error-900`）で表示されているか
- [ ] **赤い背景**: 背景が `bg-error-900/10` で表示されているか
- [ ] **タイトル色**: タイトルが `text-error-900` で表示されているか
- [ ] **説明文色**: 説明文が `text-error-900/50` で表示されているか
- [ ] **ボタン**: 削除ボタンが `variant="destructive"` で表示されているか

### その他の共通項目
- [ ] **オーバーレイ**: ダイアログ背景のオーバーレイが適切な透明度で表示されているか（`rgba(0, 0, 0, 0.3)`）
- [ ] **スクロール**: DialogBodyのコンテンツがスクロール可能か（コンテンツが多い場合）
- [ ] **フォーカス**: キーボードナビゲーションが正常に動作するか
- [ ] **ESCキー**: ESCキーでダイアログが閉じるか
- [ ] **背景クリック**: 背景クリックでダイアログが閉じるか（必要な場合）
- [ ] **レスポンシブ**: モバイルデバイスでも正しく表示されるか

## ⚠️ 特に注意すべき点

1. **ダイアログの統一**: すべてのダイアログが `@giselle-internal/ui/dialog` に統一されているか
2. **バリアントの適用**: `variant="glass"` と `variant="destructive"` が正しく適用されているか
3. **色の統一**: タイトル、説明文、ボタンの色が統一されているか
4. **スクロール動作**: DialogBodyのコンテンツが多い場合、スクロールが正常に動作するか
5. **ローディング状態**: 非同期処理中のローディング状態が正しく表示されるか
6. **エラーハンドリング**: エラーメッセージが正しく表示されるか

## 📝 確認順序

1. **まず確認**: `/settings/team/members` - 最も変更が多いページ
2. **次に確認**: `/stage/showcase` - プレイリスト作成ダイアログ
3. **必要に応じて**: 他のページで `RevokeInvitationDialog` が使用されている場合

