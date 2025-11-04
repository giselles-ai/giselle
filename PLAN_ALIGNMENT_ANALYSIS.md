# デザインスタイル整理 - 計画との整合性チェックと完了可能性評価

## 📋 計画との整合性チェック

### ✅ Phase 0-1（基盤投入）- 計画通り完了

**計画:**
- tokens.css（primitive + 互換トークン）導入
- semantic.css（semantic → primitive マッピング）導入
- aliases.css（最小の互換ユーティリティ）導入
- v3ブリッジ（text-text, bg-surface等）追加

**実装状況:**
- ✅ `internal-packages/ui/styles/tokens.css` 存在・OKLCHでprimitive定義済み
- ✅ `internal-packages/ui/styles/semantic.css` 存在・初期マッピング済み
- ✅ `internal-packages/ui/styles/aliases.css` 存在・互換ユーティリティ定義済み
- ✅ aliases.css に .text-text, .bg-surface, .border-border, .ring-focused 等定義済み
- ✅ hover/focus/active のエイリアス追加済み

**評価:** ✅ **計画通り完了**

### ✅ Phase 3（安全置換の継続）- 部分的に完了

**計画:**
- v3.x-1: settings配下の暗背景で text-white-900 → text-inverse
- v3.x-2: apps/(main)の暗背景ページで同様
- v3.x-3: internal UIのスポット対応
- v3.x-4: SVGのcurrentColor化

**実装状況:**
- ✅ codemods実装済み:
  - `scripts/codemods/replace-text-white-900-to-inverse.mjs`
  - `scripts/codemods/replace-text-black-600-20.mjs`
  - `scripts/codemods/safe-pass-1.mjs`
- ✅ 一部の置換は完了（settings/apps配下）
- ❌ text-white-*/text-black-* が約200箇所残存（49ファイル）

**評価:** ⚠️ **部分的に完了。残りは継続作業が必要**

### ✅ Phase 1.5（semanticの土台）- 計画通り完了

**計画:**
- semantic.css の雛形追加（light初期値をprimitivesにマップ）
- docs/READMEに最小の使い方メモ
- ガード導入（警告レベル）

**実装状況:**
- ✅ semantic.css 存在・初期マッピング済み
- ✅ `scripts/report-colors.mjs` 実装済み
- ✅ `scripts/guard-colors.mjs` 実装済み
- ✅ `scripts/lint-colors-code.mjs` 実装済み
- ✅ `docs/data-scope.md` 存在

**評価:** ✅ **計画通り完了**

### ✅ PR-1, PR-2, PR-3（基盤コンポーネント）- 計画通り完了

**計画:**
- PR-1: tokens/semantic/aliases.css 投入
- PR-2: UI基盤コンポーネント追加（SearchInput, Separator, Tabs, InverseSurface, LinkMuted, PageHeading, DocsLink）
- PR-3: 代表ページへの適用

**実装状況:**
- ✅ すべてのコンポーネント実装済み・エクスポート済み
- ✅ /settings/* と /workspaces に適用済み

**評価:** ✅ **計画通り完了**

### ⚠️ scopes 戦略 - 雛形のみ、実装未完了

**計画:**
- data-scope 前提のガイドと最小のスコープファイルの雛形
- styles/scopes/*.css の実装と適用

**実装状況:**
- ✅ `styles/scopes/settings-apps.css` 雛形存在（空）
- ✅ `styles/scopes/workspaces.css` 雛形存在（空）
- ✅ `styles/scopes/stage.css` 雛形存在（空）
- ❌ data-scope 属性の使用が未実装
- ❌ 各スコープの実装が未完了

**評価:** ⚠️ **雛形は完了。実装は未完了**

### ❌ Tailwind v4 移行 - 準備段階

**計画:**
- v4検証ブランチ作成・確認
- v4アップグレードPR（単独）
- v3ブリッジ（aliases.css）の段階削除計画

**実装状況:**
- ✅ v4検証ブランチ作成済み（進捗メモより）
- ❌ v4アップグレード未完了
- ❌ v3ブリッジ削除計画未起票

**評価:** ⚠️ **準備段階。v4移行は未完了**

### ❌ クリーニング - 未着手

**計画:**
- 互換トークン/ユーティリティの段階削除（white-900 等）
- stylelint/ESLint を error へ格上げ
- docs更新

**実装状況:**
- ❌ 互換トークン削除未着手
- ❌ lint格上げ未着手（warnレベルまで）

**評価:** ❌ **未着手**

## 🎯 完了可能性評価

### ✅ 完了可能な項目（基盤が整っている）

1. **安全置換の第1弾実行**
   - codemods実装済み
   - dry-run可能
   - 段階的実行可能
   - **見積:** 1-2週間（小PR分割）

2. **水平展開の完成**
   - 基盤コンポーネント実装済み
   - 適用パターン確立済み
   - **見積:** 1週間（小PR分割）

3. **aliases.css の収束**
   - 使用状況調査のスクリプト実装済み
   - 段階的置換が可能
   - **見積:** 2-3週間（小PR分割）

### ⚠️ 要検討・計画調整が必要な項目

1. **scopes の実装**
   - 雛形は完了
   - data-scope 属性の適用方針を明確化する必要がある
   - **見積:** 1-2週間（実装方針確定後）

2. **Tailwind v4 移行**
   - 検証ブランチは存在
   - 影響範囲の確認が必要
   - **見積:** 1週間（影響確認）+ 1週間（移行）

3. **lint格上げ（warn→error）**
   - lint基盤は実装済み
   - 現状のwarn件数を確認してから格上げ
   - **見積:** 1週間（現状確認 + 段階的格上げ）

### ❌ 計画外の追加作業が必要な項目

1. **text-white-*/text-black-* の残存（約200箇所）**
   - 計画では段階的削減を想定
   - 現状の使用状況を詳細分析して、安全置換できる範囲を特定する必要がある
   - **見積:** 1週間（分析）+ 2-3週間（置換）

2. **AgentCard等の特殊ケース**
   - 個別対応が必要
   - **見積:** 1週間（分析・対応）

## 📊 計画との差異・追加対応が必要な点

### 差異点

1. **text-white-*/text-black-* の残存数が多い**
   - 計画では段階的削減を想定していたが、約200箇所残存
   - 安全置換の範囲を明確化する必要がある

2. **水平展開の進捗**
   - 計画では「代表ページ」への適用を想定
   - 実際は /settings/* と /workspaces に適用済みだが、SearchInput/placeholder等の統一が不完全

3. **scopes の実装**
   - 雛形は完了しているが、実際の適用（data-scope属性の追加）が未完了

### 追加対応が必要な点

1. **現状の使用状況の詳細分析**
   - text-white-*/text-black-* の200箇所の分類（安全置換可能/要レビュー）
   - aliases.css の使用状況の全件調査

2. **安全置換の範囲明確化**
   - どの範囲を自動置換し、どの範囲を手動レビューに回すかの基準明確化

3. **scopes の適用方針決定**
   - どのページ/コンポーネントに data-scope を適用するか
   - スコープごとの上書き内容の設計

## ✅ 完了可能性の結論

### 結論: **計画通り進めれば完了可能**

**理由:**
1. ✅ **基盤は整っている**: tokens.css/semantic.css/aliases.css 導入済み
2. ✅ **ツールは実装済み**: codemods、レポート、ガードすべて実装済み
3. ✅ **実績がある**: すでに settings/apps 配下で置換成功
4. ⚠️ **残作業は明確**: 残存箇所の特定と段階的置換のみ

### 見積もり（概算）

- **安全置換の第1弾実行**: 1-2週間
- **水平展開の完成**: 1週間
- **aliases.css の収束**: 2-3週間
- **scopes の実装**: 1-2週間
- **Tailwind v4 移行**: 2週間
- **クリーニング**: 1-2週間

**合計:** 約8-12週間（2-3ヶ月）

### 推奨アプローチ

1. **即座に着手可能**
   - 安全置換の第1弾実行（dry-run → 適用）
   - 現状の使用状況の詳細分析

2. **段階的に進める**
   - 小PRで分割（1PR ~200行）
   - 各PRでビジュアル回帰確認
   - ベースブランチを適切に選択（差分縮小）

3. **計画の微調整が必要**
   - text-white-*/text-black-* の200箇所は計画より多い
   - 安全置換の範囲を明確化してから実行
   - 要レビュー箇所の優先順位付け

## 🚀 次のステップ（推奨順）

1. **現状の詳細分析**（1-2日）
   - text-white-*/text-black-* の200箇所を分類
   - 安全置換可能/要レビューの分類
   - aliases.css の使用状況全件調査

2. **安全置換の第1弾実行**（1週間）
   - dry-run で安全置換可能範囲を確認
   - 小PRに分割して実行
   - ビジュアル回帰確認

3. **水平展開の完成**（1週間）
   - SearchInput/placeholder の統一
   - Select inverse hover の適用

4. **継続的な置換**（2-3週間）
   - 段階的に生色をトークン化
   - aliases.css の収束

5. **scopes の実装**（1-2週間）
   - 適用方針決定
   - data-scope 属性の追加

6. **Tailwind v4 移行**（2週間）
   - 影響範囲確認
   - 移行実行

7. **クリーニング**（1-2週間）
   - 互換トークン削除
   - lint格上げ

