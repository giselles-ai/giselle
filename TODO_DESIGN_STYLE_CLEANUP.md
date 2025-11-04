# デザインスタイル整理 - 現在の状態とTODO

## ✅ 完了していること

### Phase 0-1（基盤投入）
- ✅ tokens.css/semantic.css/aliases.css 導入済み
- ✅ Stageの text 安全置換完了
- ✅ hover/focus/active 追加済み

### Phase 3（安全置換の継続）
- ✅ v3.x-1 settings 暗背景の text-inverse 置換完了
- ✅ v3.x-2 apps/(main) 暗背景の text-inverse 置換完了
- ✅ v3.x-3 内部UIスポット（buttons）完了
- ✅ v3.x-4 SVG currentColor 化完了

### Dialog統一と色統一（このブランチ）
- ✅ Dialogコンポーネントの統一（glass-dialog-content → ui/dialog）
  - `variant="glass"` と `variant="destructive"` の追加
  - `DialogHeader`, `DialogBody`, `DialogFooter` の追加
- ✅ settings/*配下の色統一完了
  - `text-white-400` → `text-inverse`
  - `text-black-400` → `text-text-muted`
  - `text-white-800` → `text-inverse`
  - `text-black-300` → `text-text/60`
  - `text-white-600` → `text-text/60`
  - `text-black-900` → `text-bg`
  - `text-white/80` → `text-inverse/80`
  - `text-white/30` → `text-inverse/30`
- ✅ stage/*配下の色統一完了
- ✅ components/* と services/* の色統一完了
- ✅ workflow-designer-ui/* の色統一完了（大部分）
- ✅ 残存する約13箇所の色統一完了
  - user-button.tsx
  - sidebar.tsx
  - error-components.tsx
  - not-found.tsx
  - app-detail-client.tsx
  - installed/page.tsx
  - connected/page.tsx
  - github-trigger-properties-panel.tsx

### bg/border 置換
- ✅ apps-1 完了・マージ
- ✅ apps-3 を apps-2 ベースで作成・PR中

### Phase 1.5（semantic の土台）
- ✅ semantic.css 雛形＋CIログ系追加済み
- ✅ guard:colors の警告導入済み
- ✅ data-scope ガイド雛形追加済み（docs/data-scope.md）

### PR-1: 基盤投入（完了）
- ✅ tokens.css/semantic.css/aliases.css を style.css に import
- ✅ 互換ユーティリティは aliases.css で維持

### PR-2: 基盤コンポーネント追加（完了）
- ✅ SearchInput（placeholder:text-link-muted）
- ✅ Separator（variant="inverse"対応）
- ✅ Tabs（underlineVariant="inverse"対応）
- ✅ InverseSurface（bg-surface + border-border）
- ✅ LinkMuted（text-link-muted）
- ✅ PageHeading（glow対応）
- ✅ DocsLink（tone="muted"対応）
- ✅ すべて @giselle-internal/ui からエクスポート済み

### PR-3: 代表ページへの適用（部分的に完了）
- ✅ /settings/* への PageHeading/DocsLink 適用済み
  - /settings/account, /settings/team, /settings/team/members
  - /settings/team/vector-stores, /settings/team/integrations
- ✅ /workspaces への PageHeading/DocsLink/AppListItem 適用済み
- ❌ /apps/myapps ページは存在しない（/workspacesが対応）

### scopes 雛形
- ✅ styles/scopes/settings-apps.css 作成済み（空の雛形）
- ✅ styles/scopes/workspaces.css 作成済み（空の雛形）
- ✅ styles/scopes/stage.css 作成済み（空の雛形）

## 🔄 継続中・未完了

### 1. 水平展開（settings/apps への適用）
**現状:**
- ✅ PageHeading/DocsLink は /settings/* に適用済み
- ✅ SearchInput は /settings/account/user-teams.tsx に適用済み
- ✅ SearchInput は /workspaces/components/search-header.tsx に適用済み
- ✅ Select コンポーネントは既に @giselle-internal/ui/select を使用（inverse hover 適用済み）
- ✅ AppListItem は /workspaces/components/app-list-item.tsx で統一済み

**TODO:**
- [x] /settings/* への SearchInput 適用確認と統一
- [x] /settings/* への placeholder:text-link-muted 統一（Fieldコンポーネント内のplaceholder:text-inverse/30は別用途のため除外）
- [x] /settings/* への Select inverse hover 適用
- [x] /workspaces への SearchInput/placeholder 統一
- [x] /workspaces への Select inverse hover 適用（既に適用済み）
- [x] AppListItem の統一化確認と適用

### 2. 安全置換（生色の置換）
**現状:**
- ✅ text-white-*/text-black-* の置換完了（0箇所残存）← 約200箇所 → 0箇所（100%完了）
- ✅ focus:ring-white/20 と focus:ring-white/30 の置換完了（3箇所）
- ✅ ring-white/10 の置換完了（toast.tsx、1箇所）
- bg-inverse/text-link-muted が25箇所使用中（16ファイル）

**TODO:**
- [ ] codemod safe-pass の実行（dry-run完了、0件）
  - text-black-600/20 → text-text/20（既に0件）
  - color-border-focused → ring-focused（aliases.css定義のみ）
- [ ] 安全置換の第1弾を実行（視覚差なし基準）
- [ ] 生色使用の継続削減（rgba/rgb/hex のトークン化）

### 3. aliases.css の収束
**現状:**
- aliases.css に多数のユーティリティが定義されている
- .text-link-muted, .bg-inverse/*, .text-bg 等が使用中

**TODO:**
- [ ] aliases.css の使用状況を全件調査
- [ ] 各 alias の使用箇所をトークン直参照または v4生成ユーティリティへ置換
- [ ] 段階的に alias を削除
- [ ] aliases.css をゼロ化（最終目標）

### 4. scopes の実際の適用
**現状:**
- scopes の CSS ファイルは雛形のみ（空の状態）
- data-scope 属性の使用が未実装

**TODO:**
- [ ] settings-apps スコープの実装と適用
- [ ] workspaces スコープの実装と適用
- [ ] stage スコープの実装と適用
- [ ] data-scope 属性の追加と動作確認

### 5. コンポーネントの逆色対応
**現状:**
- Separator, Tabs は variant="inverse" 対応済み
- InverseSurface は実装済みだが適用状況不明

**TODO:**
- [ ] Switch/Slider の逆色既定対応（未実装）
- [ ] InverseSurface の適用状況確認と拡大
- [ ] 逆色対応コンポーネントの統一確認

### 6. Dialog統一の完了
**現状:**
- ✅ ui/dialog への統一完了
- ✅ glass-dialog-content.tsx 削除済み
- ✅ glass-dialog.tsx 削除済み
- ✅ 残存するDialogコンポーネントも全て ui/dialog に統一完了
  - `team-creation-form.tsx` → `ui/dialog` に統一
  - `playlist-detail-client.tsx` → `ui/dialog` に統一

**TODO:**
- [x] 残存するDialogコンポーネントがないか確認
- [x] Dialog関連のコンポーネントが全て ui/dialog を使用しているか確認

### 7. その他の残タスク
- [ ] AgentCard 内の白/rgba/hex のトークン化
- [ ] v3ブリッジ段階削除計画の起票
- [ ] 互換トークン段階削除（white-900 等）
- [ ] lintのwarn→errorへの格上げ（stylelint/ESLint）
- [ ] CI で生色/alias の残件を検出 → 増加fail化
- [ ] .env.example 追加でローカル本番依存のビルド詰まりを回避

## 📊 現在の使用状況

### text-white-*/text-black-* 使用状況
- **総数:** 0箇所（0ファイル）← **100%完了！**（約200箇所 → 0箇所）

### bg-inverse/text-link-muted 使用状況
- **総数:** 25箇所（16ファイル）
- **主な使用箇所:**
  - settings配下のダイアログ
  - workspaces/components/search-header.tsx
  - auth配下のフォーム

## 🎯 次のアクション（優先順位順）

1. **安全置換の第1弾実行**
   - codemod safe-pass の dry-run 実行
   - 視覚差なし基準で安全置換を実行

2. **水平展開の完成** ✅
   - /settings/* への SearchInput/placeholder 統一 ✅
   - /workspaces への統一化 ✅

3. **aliases.css の収束開始**
   - 使用状況の全件調査
   - 段階的な置換と削除

4. **scopes の実装**
   - 各スコープの実装と data-scope 属性の追加

5. **残タスクの整理**
   - AgentCard のトークン化
   - v3ブリッジ削除計画の起票

