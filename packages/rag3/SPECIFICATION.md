# rag3 詳細仕様書 (更新版)

## 責務分担

### rag3の責務
- Pool管理 (PostgreSQL接続プール)
- IngestPipeline (DocumentLoader → Chunker → Embedder → ChunkStore)
- Embedder, Chunkerなど RAG特有の知識
- 必須カラムの型安全な定義

### giselle-engineの責務
- QueryContextの定義 (workspaceId, owner, repo)

### apps/*の責務
- テーブル名、カラム名の設定
- QueryContextをDBフィルタに変換するfilterResolverの定義

## 1. Database Configuration

### 1.1 インターフェース定義

```typescript
// database/types.ts
export interface DatabaseConfig {
  connectionString: string;
  poolConfig?: {
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
}

// 必須カラムの定義
export interface RequiredColumns {
  documentKey: string;  // ドキュメントの一意識別子
  content: string;      // チャンクのテキスト内容
  index: string;        // チャンク番号
  embedding: string;    // 埋め込みベクトル
}

// カラムマッピングの型定義（必須カラムを強制）
export type ColumnMapping<TMetadata> = RequiredColumns & {
  [K in keyof TMetadata]: string;
};
```

### 1.2 Pool管理

```typescript
// database/pool-manager.ts
export class PoolManager {
  static getPool(config: DatabaseConfig): Pool;
  static closeAll(): Promise<void>;
  static close(connectionString: string): Promise<void>;
}
```

## 2. IngestPipeline

### 2.1 インターフェース定義

```typescript
// ingest/ingest-pipeline.ts
export interface IngestPipelineConfig<TMetadata> {
  documentLoader: DocumentLoader<TMetadata>;
  chunker: Chunker;
  embedder: Embedder;
  chunkStore: ChunkStore<TMetadata>;
  options?: {
    batchSize?: number;     // 埋め込みのバッチサイズ (default: 100)
    maxRetries?: number;    // リトライ回数 (default: 3)
    retryDelay?: number;    // リトライ間隔 (default: 1000ms)
    onProgress?: (progress: IngestProgress) => void;
    onError?: (error: IngestError) => void;
  };
}

export interface IngestResult {
  totalDocuments: number;
  successfulDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  errors: Array<{ document: string; error: Error }>;
}
```

### 2.2 使用例

```typescript
const pipeline = new IngestPipeline({
  documentLoader: new GitHubBlobDocumentLoader(octokit),
  chunker: new LineChunker({ maxChunkSize: 1000 }),
  embedder: new OpenAIEmbedder({ apiKey: "..." }),
  chunkStore: new PostgresChunkStore({
    database: { connectionString: "..." },
    tableName: "embeddings",
    columnMapping: {
      content: "chunk_content",
      index: "chunk_index",
      embedding: "embedding",
      // メタデータカラム
      path: "file_path",
      commitSha: "commit_sha",
    },
  }),
  options: {
    batchSize: 50,
    onProgress: (progress) => console.log(progress),
  },
});

const result = await pipeline.ingest({
  owner: "satococoa",
  repo: "giselle",
  commitSha: "abc123",
});
```

## 3. DocumentLoader

### 3.1 インターフェース定義

```typescript
// document-loader/types.ts
export interface Document<TMetadata = Record<string, unknown>> {
  content: string;
  metadata: TMetadata;
}

export interface DocumentLoader<TMetadata = Record<string, unknown>> {
  load(params: DocumentLoaderParams): AsyncIterable<Document<TMetadata>>;
}
```

## 4. ChunkStore

### 4.1 インターフェース定義

```typescript
// chunk-store/types.ts
export interface Chunk {
  content: string;
  index: number;
}

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}

export interface ChunkStore<TMetadata = Record<string, unknown>> {
  insert(
    documentKey: string,
    chunks: ChunkWithEmbedding[],
    metadata: TMetadata
  ): Promise<void>;
  
  deleteByDocumentKey(documentKey: string): Promise<void>;
  dispose(): Promise<void>;
}
```

### 4.2 PostgreSQL実装

```typescript
// chunk-store/postgres/index.ts
export interface PostgresChunkStoreConfig<TMetadata> {
  database: DatabaseConfig;
  tableName: string;
  columnMapping: ColumnMapping<TMetadata>; // 必須カラムを強制
  staticContext?: Record<string, unknown>;
}

// 使用例
const chunkStore = new PostgresChunkStore<GitHubMetadata>({
  database: { connectionString: process.env.DATABASE_URL },
  tableName: "github_repository_embeddings",
  columnMapping: {
    // 必須カラム（必ず定義が必要）
    documentKey: "path",
    content: "chunk_content",
    index: "chunk_index",
    embedding: "embedding",
    // メタデータカラム
    path: "file_path",
    commitSha: "commit_sha",
    repositoryIndexDbId: "repository_index_db_id",
  },
  staticContext: {
    repository_index_db_id: 123,
  },
});
```

## 5. QueryService

### 5.1 インターフェース定義

```typescript
// query-service/types.ts
export interface QueryResult<TMetadata = Record<string, unknown>> {
  chunk: Chunk;
  similarity: number;
  metadata: TMetadata;
}

export interface QueryService<TContext, TMetadata = Record<string, unknown>> {
  search(
    query: string,
    context: TContext,
    limit?: number
  ): Promise<QueryResult<TMetadata>[]>;
}
```

### 5.2 PostgreSQL実装

```typescript
// query-service/postgres/index.ts
export interface PostgresQueryServiceConfig<TContext, TMetadata> {
  database: DatabaseConfig;
  tableName: string;
  embedder: Embedder;
  columnMapping: ColumnMapping<TMetadata>; // 必須カラムを強制
  contextToFilter: (context: TContext) => Record<string, unknown>;
  searchOptions?: {
    distanceFunction?: DistanceFunction;
  };
}
```

## 6. 使用例

### 6.1 apps層での統合（更新版）

```typescript
// apps/studio.giselles.ai/services/vector-store/github-ingest.ts
import { 
  IngestPipeline,
  PostgresChunkStore,
  PostgresQueryService,
  OpenAIEmbedder,
  LineChunker,
  type DatabaseConfig,
  type ColumnMapping
} from "@giselle/rag3";
import { GitHubBlobDocumentLoader } from "@giselle/github-tool";

// 型定義
interface GitHubChunkMetadata {
  commitSha: string;
  fileSha: string;
  path: string;
  nodeId: string;
  repositoryIndexDbId: number;
}

// 必須カラムを含むカラムマッピング
const columnMapping: ColumnMapping<GitHubChunkMetadata> = {
  // 必須カラム（TypeScriptが強制）
  documentKey: "path",
  content: "chunk_content",
  index: "chunk_index",
  embedding: "embedding",
  // メタデータカラム
  commitSha: "commit_sha",
  fileSha: "file_sha",
  path: "path",
  nodeId: "node_id",
  repositoryIndexDbId: "repository_index_db_id",
};

const database: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL!,
  poolConfig: {
    max: 20,
    idleTimeoutMillis: 30000,
  },
};

// インジェスト処理
export async function ingestGitHubRepository(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    commitSha: string;
    repositoryIndexDbId: number;
  }
) {
  const pipeline = new IngestPipeline({
    documentLoader: new GitHubBlobDocumentLoader(octokit),
    chunker: new LineChunker({ maxChunkSize: 1000 }),
    embedder: new OpenAIEmbedder({ 
      apiKey: process.env.OPENAI_API_KEY!,
      model: "text-embedding-3-small",
    }),
    chunkStore: new PostgresChunkStore<GitHubChunkMetadata>({
      database,
      tableName: "github_repository_embeddings",
      columnMapping,
      staticContext: {
        repository_index_db_id: params.repositoryIndexDbId,
      },
    }),
    options: {
      batchSize: 50,
      onProgress: (progress) => {
        console.log(`Progress: ${progress.processedDocuments}/${progress.totalDocuments}`);
      },
      onError: (error) => {
        console.error(`Error processing ${error.document}:`, error.error);
      },
    },
  });

  const result = await pipeline.ingest({
    owner: params.owner,
    repo: params.repo,
    commitSha: params.commitSha,
  });

  console.log(`Ingestion complete:`, result);
  return result;
}
```

### 6.2 giselle-engineでの使用

```typescript
// packages/giselle-engine/src/types/query-context.ts
export interface QueryContext {
  workspaceId: string;
  owner?: string;
  repo?: string;
}

// packages/giselle-engine/src/nodes/execute-query.ts
import type { QueryService } from "@giselle/rag3";
import type { QueryContext } from "../types/query-context";

export async function executeQuery(
  queryService: QueryService<QueryContext, any>,
  params: {
    query: string;
    context: QueryContext;
    limit?: number;
  }
) {
  const results = await queryService.search(
    params.query,
    params.context,
    params.limit
  );

  return {
    results: results.map(r => ({
      content: r.chunk.content,
      score: r.similarity,
      metadata: r.metadata,
    })),
    totalResults: results.length,
  };
}
```

### 6.3 apps層でのQueryService設定

```typescript
// apps/studio.giselles.ai/services/vector-store/github-query.ts
import { PostgresQueryService, OpenAIEmbedder } from "@giselle/rag3";
import type { QueryContext } from "@giselle/giselle-engine";

// filterResolverの定義（apps層の責務）
function createFilterResolver(getRepositoryId: (context: QueryContext) => number) {
  return (context: QueryContext) => {
    const filters: Record<string, unknown> = {};
    
    // workspaceIdから適切なrepository_index_db_idを解決
    filters.repository_index_db_id = getRepositoryId(context);
    
    // その他のフィルタ条件
    if (context.owner) {
      filters.owner = context.owner;
    }
    if (context.repo) {
      filters.repo = context.repo;
    }
    
    return filters;
  };
}

export function createGitHubQueryService(
  getRepositoryId: (context: QueryContext) => number
) {
  return new PostgresQueryService<QueryContext, GitHubChunkMetadata>({
    database,
    tableName: "github_repository_embeddings",
    embedder: new OpenAIEmbedder({
      apiKey: process.env.OPENAI_API_KEY!,
    }),
    columnMapping,
    contextToFilter: createFilterResolver(getRepositoryId),
  });
}
```

## 7. エラーハンドリング

### 7.1 エラータイプ

```typescript
// errors.ts
export class Rag3Error extends Error {}
export class ValidationError extends Rag3Error {}
export class DatabaseError extends Rag3Error {}
export class EmbeddingError extends Rag3Error {}
```

## 8. 移行ガイド

### 8.1 主な変更点

1. **Pool管理の内部化**
   - 外部からPoolを渡す → DatabaseConfigを渡す
   - rag3がPool管理を担当

2. **IngestPipelineの追加**
   - 個別にDocumentLoader, Chunker, Embedder, ChunkStoreを使う → IngestPipelineで統合
   - エラーハンドリング、リトライ、バッチ処理が組み込み済み

3. **必須カラムの型安全性**
   - `ColumnMapping<TMetadata>`型により、必須カラムの定義漏れをコンパイル時に検出

4. **QueryContextの標準化**
   - giselle-engineがQueryContextを定義
   - apps層がfilterResolverを実装

### 8.2 移行手順

```typescript
// Before
const pool = new Pool({ connectionString });
const chunkStore = new PostgresChunkStore({
  pool,
  tableName: "embeddings",
  columnMapping: { /* ... */ },
});

// After
const chunkStore = new PostgresChunkStore({
  database: { connectionString },
  tableName: "embeddings",
  columnMapping: {
    // 必須カラムの定義が強制される
    documentKey: "path",
    content: "chunk_content",
    index: "chunk_index",
    embedding: "embedding",
    // メタデータカラム
    /* ... */
  },
});
```