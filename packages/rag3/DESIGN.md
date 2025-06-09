# rag3 設計書

## 概要

rag3は、rag2の型システムの複雑さを解消し、よりシンプルで保守しやすいRAG（Retrieval Augmented Generation）システムを提供します。

## 設計原則

1. **シンプルな型システム**
   - 最大2層までのジェネリクス
   - Zodは外部入力のバリデーションのみに使用
   - 型キャストの最小化

2. **明確な責務分離**
   - DocumentLoader: 外部リソースの取得
   - ChunkStore: データの永続化
   - QueryService: データの検索
   - 各モジュールは独立して使用可能

3. **実用性重視**
   - apps層での使いやすさを優先
   - 多少のボイラープレートは許容
   - 型安全性と使いやすさのバランス

## モジュール構成

```
packages/rag3/
├── src/
│   ├── document-loader/
│   │   ├── types.ts          # DocumentLoader interface
│   │   └── index.ts
│   ├── chunk-store/
│   │   ├── types.ts          # ChunkStore interface
│   │   ├── postgres/         # PostgreSQL実装
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── query-service/
│   │   ├── types.ts          # QueryService interface
│   │   ├── postgres/         # PostgreSQL実装
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── embedder/
│   │   ├── types.ts          # Embedder interface
│   │   ├── openai.ts         # OpenAI実装
│   │   └── index.ts
│   ├── chunker/
│   │   ├── types.ts          # Chunker interface
│   │   ├── line-chunker.ts   # 行ベースチャンカー
│   │   └── index.ts
│   └── index.ts              # Public exports
└── README.md
```

## 型定義

### 基本型

```typescript
// 純粋なTypeScript型定義（Zodに依存しない）
export interface Document<TMetadata = Record<string, unknown>> {
  content: string;
  metadata: TMetadata;
}

export interface Chunk {
  content: string;
  index: number;
}

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}

export interface QueryResult<TMetadata = Record<string, unknown>> {
  chunk: Chunk;
  similarity: number;
  metadata: TMetadata;
}
```

### インターフェース

```typescript
// DocumentLoader
export interface DocumentLoader<TMetadata> {
  load(params: unknown): AsyncIterable<Document<TMetadata>>;
}

// ChunkStore
export interface ChunkStore<TMetadata> {
  insert(
    documentKey: string,
    chunks: ChunkWithEmbedding[],
    metadata: TMetadata
  ): Promise<void>;
  
  deleteByDocumentKey(documentKey: string): Promise<void>;
}

// QueryService
export interface QueryService<TContext, TMetadata> {
  search(
    query: string,
    context: TContext,
    limit?: number
  ): Promise<QueryResult<TMetadata>[]>;
}
```

## 実装方針

### 1. DocumentLoader

- インターフェースのみrag3で定義
- 具体的な実装（GitHubBlobDocumentLoader等）は各ツールパッケージで実装
- メタデータの型は実装側で定義

### 2. ChunkStore

- PostgreSQL実装を提供
- テーブル構造は使用側（apps）で定義
- カラムマッピングは明示的に指定

```typescript
// apps層での使用例
const chunkStore = new PostgresChunkStore({
  pool,
  tableName: "github_repository_embeddings",
  columnMapping: {
    documentKey: "path",
    content: "chunk_content",
    index: "chunk_index",
    embedding: "embedding",
    // メタデータのマッピング
    commitSha: "commit_sha",
    fileSha: "file_sha",
    nodeId: "node_id",
    repositoryIndexDbId: "repository_index_db_id"
  },
  // 静的なコンテキスト（全レコードに適用）
  staticContext: {
    repositoryIndexDbId: 123
  }
});
```

### 3. QueryService

- PostgreSQL + pgvector実装を提供
- フィルタリングは明示的な関数で実装

```typescript
// apps層での使用例
const queryService = new PostgresQueryService({
  pool,
  tableName: "github_repository_embeddings",
  embedder,
  // コンテキストからSQLフィルタへの変換
  contextToFilter: (context: { repositoryId: number }) => ({
    repository_index_db_id: context.repositoryId
  })
});
```

### 4. Embedder/Chunker

- シンプルなインターフェース
- 実装の詳細は隠蔽

## バリデーション戦略

- 外部入力（API、ファイル等）はZodでバリデーション
- 内部処理では型システムに依存
- バリデーションは境界（boundary）でのみ実施

## 移行計画

1. rag3パッケージの作成
2. 基本的なインターフェースと型の定義
3. PostgreSQL実装の移植（簡素化）
4. apps層での使用例の作成
5. rag2からの段階的な移行

## 期待される効果

1. **型システムの簡素化**
   - 型エラーの理解が容易に
   - IDEの補完が高速化

2. **保守性の向上**
   - 各モジュールが独立
   - テストが書きやすい

3. **開発効率の向上**
   - ボイラープレートは増えるが、理解しやすい
   - デバッグが容易

## 制約事項

- PostgreSQL + pgvectorのみサポート（初期実装）
- OpenAI embeddingsのみサポート（初期実装）
- テキストデータのみ対象