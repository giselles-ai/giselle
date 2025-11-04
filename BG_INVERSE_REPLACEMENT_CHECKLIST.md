# bg-inverse系 置換チェックリスト

## 置換完了（一部）

### bg-inverse/5 → bg-[color-mix(in_srgb,var(--color-text-inverse,var(--color-white,#fff))_5%,transparent)]
1. ✅ `apps/studio.giselles.ai/app/(main)/settings/team/invite-member-dialog.tsx`
   - メールアドレス入力フィールドの背景
   
2. ✅ `apps/studio.giselles.ai/app/(main)/settings/components/profile-edit-modal.tsx`
   - 表示名入力フィールドの背景
   
3. ✅ `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-edit-modal.tsx`
   - チーム名入力フィールドの背景
   
4. ✅ `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/repository-registration-dialog.tsx`
   - Code ConfigurationとPull Requests Configurationの背景（2箇所）
   - プロファイル選択のホバー背景
   
5. ✅ `apps/studio.giselles.ai/app/(main)/settings/team/vector-stores/configure-sources-dialog.tsx`
   - ソース設定の背景
   - プロファイル選択のホバー背景

## 残りの置換が必要な箇所

### bg-inverse/5系
- 残り箇所を確認して段階的に置換

### bg-inverse/10系
- 多数の箇所で使用中
- 同じパターンで置換

### bg-inverse/15, /20, /30系
- 比較的少ないが同様に置換

### hover:, focus:, active: バリアント
- 各バリアントも同様に置換

## 確認が必要なページ

### Settingsページ
- `/settings/account` - プロフィール編集モーダルの入力フィールド背景
- `/settings/team` - チームプロフィール編集モーダルの入力フィールド背景
- `/settings/team/invite` - メンバー招待ダイアログの入力フィールド背景
- `/settings/team/vector-stores` - リポジトリ登録/設定ダイアログの背景

## 置換パターン

- `bg-inverse/5` → `bg-[color-mix(in_srgb,var(--color-text-inverse,var(--color-white,#fff))_5%,transparent)]`
- `bg-inverse/10` → `bg-[color-mix(in_srgb,var(--color-text-inverse,var(--color-white,#fff))_10%,transparent)]`
- `hover:bg-inverse/5` → `hover:bg-[color-mix(in_srgb,var(--color-text-inverse,var(--color-white,#fff))_5%,transparent)]`

## 次のステップ

1. 目視確認完了後、残りの`bg-inverse/5`と`bg-inverse/10`を置換
2. その後、`bg-inverse/15`, `/20`, `/30`を置換
3. 最後に、`aliases.css`から`bg-inverse`系の定義を削除
