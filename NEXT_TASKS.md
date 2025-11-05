# 次のタスク - aliases.css 収束継続

## 📊 現在の状況

### ✅ 完了済みの置換
- ✅ `text-link-muted` の置換（**ただしコンポーネント内での使用は残存**）
- ✅ `text-bg` の置換（**ただし使用箇所が残存**）
- ✅ `bg-inverse` の置換完了・削除済み
- ✅ `border-inverse` の置換完了・削除済み
- ✅ `placeholder:text-inverse/30`, `placeholder:text-inverse/40` の削除済み

### 🔍 現在の使用状況

#### `text-link-muted`（9ファイル）
**定義場所:** `aliases.css` に定義あり（`.placeholder\:text-link-muted::placeholder`）

**使用ファイル:**
1. `internal-packages/ui/components/search-input.tsx` - コンポーネント内で使用
2. `internal-packages/ui/components/link-muted.tsx` - コンポーネント内で使用
3. `internal-packages/ui/components/docs-link.tsx` - コンポーネント内で使用（`tone="secondary"`時）
4. `apps/studio.giselles.ai/app/(main)/settings/account/user-teams.tsx` - `placeholder:text-link-muted`
5. `apps/studio.giselles.ai/app/(main)/settings/components/profile-edit-modal.tsx` - `placeholder:text-link-muted`
6. `apps/studio.giselles.ai/app/(main)/settings/team/team-profile-edit-modal.tsx` - `placeholder:text-link-muted`
7. `apps/studio.giselles.ai/app/(main)/settings/team/invite-member-dialog.tsx` - 使用箇所を確認要
8. その他2ファイル

**注意:** UIコンポーネント（`search-input.tsx`, `link-muted.tsx`, `docs-link.tsx`）で使用されているため、置換には注意が必要。

#### `text-bg`（13ファイル）
**定義場所:** `aliases.css` に定義あり

**使用ファイル:**
- `internal-packages/workflow-designer-ui/src/editor/node/node.tsx`（7箇所）
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/outputs/components.tsx`
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/ui/properties-panel.tsx`（5箇所）
- `internal-packages/workflow-designer-ui/src/new-editor/components/node/node.tsx`
- その他の workflow-designer-ui 内のファイル

**注意:** 主に workflow-designer-ui 内で使用されているため、置換範囲が限定的。

---

## 🎯 次のタスク（優先順位順）

### 1. 🔴 最優先: `text-link-muted` の置換

**現状:**
- 9ファイルで使用中
- UIコンポーネント内での使用が3ファイルあるため、影響範囲が広い

**アプローチ:**
1. **ページ内での使用を先に置換**（6ファイル）
   - `user-teams.tsx`, `profile-edit-modal.tsx`, `team-profile-edit-modal.tsx`, `invite-member-dialog.tsx` など
   - `placeholder:text-link-muted` → `placeholder:text-[var(--color-link-muted)]`
2. **UIコンポーネント内の使用を置換**（3ファイル）
   - `search-input.tsx`: `placeholder:text-link-muted` → `placeholder:text-[var(--color-link-muted)]`
   - `link-muted.tsx`: `text-link-muted` → `text-[var(--color-link-muted)]`
   - `docs-link.tsx`: `text-link-muted` → `text-[var(--color-link-muted)]`（`tone="secondary"`時）
3. **aliases.css から定義を削除**

**確認が必要なページ:**
- `/settings/account` - user-teams.tsx
- `/settings/account` - profile-edit-modal.tsx（ダイアログ）
- `/settings/team` - team-profile-edit-modal.tsx（ダイアログ）
- `/settings/team` - invite-member-dialog.tsx（ダイアログ）
- `/workspaces` - SearchInputコンポーネント
- その他SearchInputを使用しているすべてのページ

---

### 2. 🟡 高優先度: `text-bg` の置換

**現状:**
- 13ファイルで使用中（主に workflow-designer-ui 内）

**アプローチ:**
1. **使用箇所を確認**
   - workflow-designer-ui 内のノードアイコンやラベルなど
2. **置換**
   - `text-bg` → `text-[var(--color-background)]`
3. **aliases.css から定義を削除**

**確認が必要なページ:**
- Workflow Designer UI のすべてのノード表示
- Properties Panel のラベル表示

---

### 3. 🟢 中優先度: その他の aliases.css 定義の調査と置換

**調査が必要な定義:**
- `text-inverse` - 多数の箇所で使用中（広範囲）
- `text-text` - 多数の箇所で使用中（広範囲）
- `text-accent`, `bg-accent`, `border-accent` - 使用中
- `text-secondary`, `bg-secondary` - 使用中
- `hover:text-text/*`, `hover:text-inverse/*` - 使用中
- `text-text/*` (opacity variants) - 使用中
- `bg-surface`, `bg-bg`, `bg-transparent`, `bg-stage`, `bg-auth` - 使用中

**アプローチ:**
1. 各定義の使用状況を全件調査
2. 使用箇所が少ない定義から優先的に置換
3. 広範囲に使用されている定義は後回し

---

### 4. 🟢 低優先度: 安全置換の実行

**現状:**
- `text-white-*/text-black-*` の置換完了（100%）
- `focus:ring-white/20`, `focus:ring-white/30` の置換完了
- `ring-white/10` の置換完了

**TODO:**
- [ ] codemod safe-pass の実行（dry-run完了、0件）
- [ ] 安全置換の第1弾実行（視覚差なし基準）
- [ ] 生色使用の継続削減（rgba/rgb/hex のトークン化）

---

### 5. 🟢 低優先度: scopes の実装

**現状:**
- scopes の CSS ファイルは雛形のみ（空の状態）
- `data-scope` 属性の使用が未実装

**TODO:**
- [ ] settings-apps スコープの実装と適用
- [ ] workspaces スコープの実装と適用
- [ ] stage スコープの実装と適用
- [ ] `data-scope` 属性の追加と動作確認

---

### 6. 🟢 低優先度: コンポーネントの逆色対応拡大

**現状:**
- `Separator`, `Tabs` は `variant="inverse"` 対応済み
- `InverseSurface` は実装済みだが適用状況不明

**TODO:**
- [ ] `Switch/Slider` の逆色既定対応（未実装）
- [ ] `InverseSurface` の適用状況確認と拡大
- [ ] 逆色対応コンポーネントの統一確認

---

### 7. 🟢 低優先度: v3ブリッジ削除計画

**現状:**
- `aliases.css` の収束が進行中
- 互換トークン（`white-900` 等）が残っている

**TODO:**
- [ ] v3ブリッジ段階削除計画の起票
- [ ] 互換トークン段階削除（`white-900` 等）
- [ ] lint の warn→error への格上げ（stylelint/ESLint）
- [ ] CI で生色/alias の残件を検出 → 増加fail化

---

## 📋 具体的な作業手順（次のアクション）

### Step 1: `text-link-muted` の置換（優先度: 🔴 最優先）

1. **ページ内での使用を置換**（6ファイル）
   ```bash
   # 置換対象ファイルを確認
   - user-teams.tsx
   - profile-edit-modal.tsx
   - team-profile-edit-modal.tsx
   - invite-member-dialog.tsx
   - その他2ファイル
   ```

2. **UIコンポーネント内の使用を置換**（3ファイル）
   - `search-input.tsx`: `placeholder:text-link-muted` → `placeholder:text-[var(--color-link-muted)]`
   - `link-muted.tsx`: `text-link-muted` → `text-[var(--color-link-muted)]`
   - `docs-link.tsx`: `text-link-muted` → `text-[var(--color-link-muted)]`（`tone="secondary"`時のみ）

3. **aliases.css から定義を削除**
   ```css
   /* 削除対象 */
   .placeholder\:text-link-muted::placeholder {
     color: var(--color-link-muted) !important;
   }
   ```

4. **視覚確認**
   - `/settings/account` ページ
   - `/settings/team` ページ
   - `/workspaces` ページ
   - SearchInput を使用しているすべてのページ

---

### Step 2: `text-bg` の置換（優先度: 🟡 高優先度）

1. **使用箇所の確認**（13ファイル）
2. **置換**
   - `text-bg` → `text-[var(--color-background)]`
3. **aliases.css から定義を削除**
4. **視覚確認**
   - Workflow Designer UI のすべてのノード表示
   - Properties Panel のラベル表示

---

## ⚠️ 注意事項

1. **UIコンポーネントの置換**
   - `search-input.tsx`, `link-muted.tsx`, `docs-link.tsx` は多くのページで使用されているため、置換後は広範囲な視覚確認が必要

2. **段階的な置換**
   - 一度に全てを置換せず、小さな単位で進める
   - 各ステップでコミット・視覚確認を実施

3. **視覚確認の重要性**
   - 特に UIコンポーネントの変更は影響範囲が広いため、必ず視覚確認を実施
