# @giselle/rag3

Simplified RAG (Retrieval Augmented Generation) system with type safety.

## Design Goals

- **Simplified Type System**: Maximum 2-layer generics, no type puzzles
- **Clear Separation of Concerns**: Independent modules for loading, storing, and querying
- **Practical Usage**: Prioritize usability over abstract perfection
- **Type Safety**: Runtime validation with Zod for external inputs, TypeScript for internal consistency
- **Built-in Pool Management**: Connection pooling handled internally
- **Integrated Pipeline**: IngestPipeline with error handling, retry logic, and batch optimization

## Quick Start

### Using IngestPipeline (Recommended)

```typescript
import { 
  IngestPipeline,
  PostgresChunkStore, 
  PostgresQueryService, 
  OpenAIEmbedder, 
  LineChunker,
  type ColumnMapping,
  type DatabaseConfig
} from "@giselle/rag3";

// Define your metadata type
interface GitHubMetadata {
  commitSha: string;
  fileSha: string;
  path: string;
  nodeId: string;
  repositoryIndexDbId: number;
}

// Database configuration
const database: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL!,
  poolConfig: { max: 20 }
};

// Column mapping with required columns
const columnMapping: ColumnMapping<GitHubMetadata> = {
  // Required columns (TypeScript enforces these)
  documentKey: "path",
  content: "chunk_content",
  index: "chunk_index",
  embedding: "embedding",
  // Metadata columns
  commitSha: "commit_sha",
  fileSha: "file_sha",
  path: "path",
  nodeId: "node_id",
  repositoryIndexDbId: "repository_index_db_id",
};

// Create and run pipeline
const pipeline = new IngestPipeline({
  documentLoader: yourDocumentLoader,
  chunker: new LineChunker({ maxChunkSize: 1000 }),
  embedder: new OpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY! }),
  chunkStore: new PostgresChunkStore<GitHubMetadata>({
    database,
    tableName: "github_repository_embeddings",
    columnMapping,
    staticContext: { repository_index_db_id: 123 }
  }),
  options: {
    batchSize: 50,
    onProgress: (progress) => console.log(progress)
  }
});

const result = await pipeline.ingest({ /* loader params */ });

// Query service
const queryService = new PostgresQueryService<
  { repositoryId: number }, 
  GitHubMetadata
>({
  database,
  tableName: "github_repository_embeddings",
  embedder: new OpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY! }),
  columnMapping,
  contextToFilter: (context) => ({
    repository_index_db_id: context.repositoryId,
  }),
});

const results = await queryService.search("search query", { repositoryId: 123 });
```

## Modules

### DocumentLoader

Interface for loading documents from external sources.

```typescript
interface DocumentLoader<TMetadata> {
  load(params: DocumentLoaderParams): AsyncIterable<Document<TMetadata>>;
}
```

### ChunkStore

Handles persistence of document chunks with embeddings.

```typescript
interface ChunkStore<TMetadata> {
  insert(documentKey: string, chunks: ChunkWithEmbedding[], metadata: TMetadata): Promise<void>;
  deleteByDocumentKey(documentKey: string): Promise<void>;
  dispose(): Promise<void>;
}
```

### QueryService

Performs vector similarity search with filtering.

```typescript
interface QueryService<TContext, TMetadata> {
  search(query: string, context: TContext, limit?: number): Promise<QueryResult<TMetadata>[]>;
}
```

### Embedder

Converts text to embedding vectors.

```typescript
interface Embedder {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

### Chunker  

Splits text into chunks.

```typescript
interface Chunker {
  chunk(text: string): string[];
}
```

## Database Schema

The PostgreSQL implementation expects tables with these required columns:

- `documentKey`: TEXT - Unique document identifier (maps to your document path/id)
- `content`: TEXT - Chunk content
- `index`: INTEGER - Chunk index within document  
- `embedding`: VECTOR - Embedding vector (pgvector)
- Additional metadata columns as defined in your `columnMapping`

Example table:

```sql
CREATE TABLE github_repository_embeddings (
  db_id SERIAL PRIMARY KEY,
  repository_index_db_id INTEGER NOT NULL,
  commit_sha TEXT NOT NULL,
  file_sha TEXT NOT NULL, 
  path TEXT NOT NULL,
  node_id TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  chunk_content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON github_repository_embeddings 
USING hnsw (embedding vector_cosine_ops);
```

## Migration from rag2

Key differences:

1. **Built-in Pool Management**: Database connections handled internally
2. **IngestPipeline**: Integrated ingestion with error handling and retry logic
3. **Required Columns**: TypeScript enforces documentKey, content, index, embedding
4. **Explicit Column Mapping**: No more automatic camelCase → snake_case conversion
5. **Simplified Types**: No complex Zod-based type definitions  
6. **Clear Boundaries**: Validation only at package boundaries

See `SPECIFICATION.md` for detailed migration examples.

## License

MIT