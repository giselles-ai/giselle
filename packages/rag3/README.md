# @giselle-sdk/rag3

Giselle RAG (Retrieval-Augmented Generation) system built for production use
with PostgreSQL and pgvector.

## Quick Start

### 1. Factory Functions (Recommended)

Use preset factory functions for common scenarios:

```typescript
import {
  createChunkStore,
  createIngestPipeline,
  createQueryService,
} from "@giselle-sdk/rag3";
import { z } from "zod/v4";

// Define metadata schema
const GitHubSchema = z.object({
  repositoryId: z.number(),
  commitSha: z.string(),
  filePath: z.string(),
  lastModified: z.date(),
});

// Create ingestion pipeline
const pipeline = createIngestPipeline({
  documentLoader: yourDocumentLoader,
  chunkStore: createChunkStore({
    database: { connectionString: process.env.DATABASE_URL! },
    tableName: "github_chunks",
    preset: "github", // Built-in GitHub metadata preset
  }),
  metadataTransform: (sourceMetadata) => ({
    repositoryId: sourceMetadata.repoId,
    commitSha: sourceMetadata.sha,
    filePath: sourceMetadata.path,
    lastModified: new Date(sourceMetadata.updatedAt),
  }),
});

// Ingest documents
const result = await pipeline.ingest(/* loader params */);

// Create query service
const queryService = createQueryService({
  database: { connectionString: process.env.DATABASE_URL! },
  tableName: "github_chunks",
  embedder: createDefaultEmbedder({ apiKey: process.env.OPENAI_API_KEY! }),
  preset: "github",
  contextToFilter: (context) => ({ repository_id: context.repositoryId }),
});

// Search
const results = await queryService.search("search query", {
  repositoryId: 123,
});
```

### 2. Manual Configuration

For full control over configuration:

```typescript
import {
  IngestPipeline,
  LineChunker,
  OpenAIEmbedder,
  PostgresChunkStore,
  PostgresQueryService,
} from "@giselle-sdk/rag3";

const database = {
  connectionString: process.env.DATABASE_URL!,
  poolConfig: { max: 20, idleTimeoutMillis: 30000 },
};

const columnMapping = {
  documentKey: "file_path",
  content: "chunk_content",
  index: "chunk_index",
  embedding: "embedding",
  repositoryId: "repository_id",
  commitSha: "commit_sha",
  filePath: "file_path",
  lastModified: "last_modified",
};

// Ingestion
const pipeline = new IngestPipeline({
  documentLoader: yourDocumentLoader,
  chunker: new LineChunker({ maxChunkSize: 1000, overlap: 100 }),
  embedder: new OpenAIEmbedder({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "text-embedding-3-small",
  }),
  chunkStore: new PostgresChunkStore({
    database,
    tableName: "github_chunks",
    columnMapping,
    staticContext: { repository_id: 123 },
  }),
  metadataTransform: (source) => ({
    repositoryId: source.repoId,
    commitSha: source.sha,
    filePath: source.path,
    lastModified: new Date(source.updatedAt),
  }),
  options: {
    batchSize: 50,
    retryCount: 3,
    onProgress: (progress) =>
      console.log(`${progress.processedCount}/${progress.totalCount}`),
  },
});

await pipeline.ingest(loaderParams);

// Querying
const queryService = new PostgresQueryService({
  database,
  tableName: "github_chunks",
  embedder: new OpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY! }),
  columnMapping,
  contextToFilter: (context) => ({ repository_id: context.repositoryId }),
  searchOptions: {
    distanceFunction: "cosine",
    limit: 10,
  },
});

const results = await queryService.search("implement authentication", {
  repositoryId: 123,
});
```

## Architecture

### Core Components

#### IngestPipeline

Orchestrates the complete ingestion process with built-in error handling, retry
logic, and progress tracking.

```typescript
const pipeline = new IngestPipeline<SourceMetadata, TargetMetadata>({
  documentLoader: DocumentLoader<SourceMetadata>,
  chunker: Chunker,
  embedder: Embedder,
  chunkStore: ChunkStore<TargetMetadata>,
  metadataTransform?: (source: SourceMetadata) => TargetMetadata,
  options?: {
    batchSize?: number;
    retryCount?: number;
    onProgress?: (progress: IngestProgress) => void;
  },
});

const result = await pipeline.ingest(params);
```

#### DocumentLoader

Loads documents from external sources (GitHub, file system, APIs, etc.).

```typescript
interface DocumentLoader<TMetadata> {
  load(params: unknown): AsyncIterable<Document<TMetadata>>;
}

interface Document<TMetadata> {
  key: string;
  content: string;
  metadata: TMetadata;
}
```

#### ChunkStore

Persists document chunks with embeddings to PostgreSQL + pgvector.

```typescript
interface ChunkStore<TMetadata> {
  insert(
    documentKey: string,
    chunks: ChunkWithEmbedding[],
    metadata: TMetadata,
  ): Promise<void>;
  deleteByDocumentKey(documentKey: string): Promise<void>;
  dispose(): Promise<void>;
}
```

#### QueryService

Performs vector similarity search with context-based filtering.

```typescript
interface QueryService<TContext, TMetadata> {
  search(
    query: string,
    context: TContext,
    limit?: number,
  ): Promise<QueryResult<TMetadata>[]>;
}

interface QueryResult<TMetadata> {
  chunk: { content: string; index: number };
  similarity: number;
  metadata: TMetadata;
}
```

#### Embedder

Converts text to embedding vectors using various providers.

```typescript
interface Embedder {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// Built-in embedders
new OpenAIEmbedder({ apiKey, model?: "text-embedding-3-small" });
```

#### Chunker

Splits documents into smaller chunks for embedding.

```typescript
interface Chunker {
  chunk(text: string): string[];
}

// Built-in chunkers
new LineChunker({ maxChunkSize: 1000, overlap?: 100 });
```

### Factory Functions

#### Metadata Schema Helpers

Utilities for schema management:

```typescript
import {
  createColumnMappingFromZod,
  validateMetadata,
} from "@giselle-sdk/rag3/schemas";

// Auto-generate column mappings from Zod schemas
const mapping = createColumnMappingFromZod(schema, {
  caseConversion: "snake_case" | "camelCase" | "none",
  customMappings: { field: "custom_column" },
});

// Runtime metadata validation
const validMetadata = validateMetadata(unknownData, schema);
```

## Database Setup

### Prerequisites

1. PostgreSQL with pgvector extension
2. Node.js with TypeScript support

### Required Columns

Every table must include these columns (enforced by TypeScript):

```typescript
interface RequiredColumns {
  documentKey: string; // Unique document identifier
  content: string; // Chunk text content
  index: string; // Chunk index within document
  embedding: string; // Vector embedding column
}
```

### Column Mapping

Map your metadata fields to database columns:

```typescript
const columnMapping: ColumnMapping<YourMetadata> = {
  // Required columns
  documentKey: "file_path",
  content: "chunk_content",
  index: "chunk_index",
  embedding: "embedding",
  // Metadata columns
  repositoryId: "repository_id",
  commitSha: "commit_sha",
  lastModified: "last_modified",
};
```

### Example Schema

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- GitHub repository chunks table
CREATE TABLE github_chunks (
  id SERIAL PRIMARY KEY,

  -- Required columns
  file_path TEXT NOT NULL,           -- documentKey
  chunk_content TEXT NOT NULL,       -- content
  chunk_index INTEGER NOT NULL,      -- index
  embedding VECTOR(1536) NOT NULL,   -- embedding (OpenAI dimensions)

  -- Metadata columns
  repository_id INTEGER NOT NULL,
  commit_sha TEXT NOT NULL,
  last_modified TIMESTAMP NOT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity search index (HNSW)
CREATE INDEX github_chunks_embedding_cosine_idx
ON github_chunks USING hnsw (embedding vector_cosine_ops);

-- Metadata filtering indexes
CREATE INDEX github_chunks_repository_id_idx ON github_chunks (repository_id);
CREATE INDEX github_chunks_commit_sha_idx ON github_chunks (commit_sha);
```

## Error Handling

The package provides a comprehensive error system for different failure modes:

### Error Types

```typescript
// Validation errors (Zod validation failures)
ValidationError.fromZodError(zodError, context?)

// Database errors
DatabaseError.connectionFailed(cause?, context?)
DatabaseError.queryFailed(query, cause?, context?)
DatabaseError.transactionFailed(operation, cause?, context?)

// Embedding API errors
EmbeddingError.apiError(cause?, context?)
EmbeddingError.rateLimitExceeded(retryAfter, context?)
EmbeddingError.invalidInput(input, context?)

// Configuration errors
ConfigurationError.missingField(field, context?)
ConfigurationError.invalidValue(field, value, expected, context?)

// Operation errors
OperationError.documentNotFound(documentKey, context?)
OperationError.invalidOperation(operation, reason, context?)
```

### Error Handling Utilities

```typescript
import { handleError, isErrorCategory, isErrorCode } from "@giselle-sdk/rag3";

// Type-safe error handling
handleError(error, {
  VALIDATION_FAILED: (err) => console.log("Validation:", err.validationDetails),
  CONNECTION_FAILED: (err) => console.log("DB connection failed:", err.context),
  RATE_LIMIT_EXCEEDED: (err) =>
    console.log("Rate limited, retry after:", err.context?.retryAfter),
  default: (err) => console.log("Unknown error:", err.message),
});

// Error type checking
if (isErrorCategory(error, "database")) {
  // Handle database-related errors
}

if (isErrorCode(error, "CONNECTION_FAILED")) {
  // Specific error code handling
}
```
