# @giselle-sdk/rag

A RAG (Retrieval-Augmented Generation) system built with TypeScript, PostgreSQL,
and pgvector.

## Features

### Query Service

- **Vector similarity search** with PostgreSQL + pgvector
- **Type-safe queries** with full TypeScript support and Zod validation
- **Flexible filtering** with context-to-filter mapping
- **Connection pooling** for production performance
- **Comprehensive error handling** with structured error types

### Ingest Pipeline

- **Document processing** with configurable chunking strategies
- **Batch embedding** for efficient processing
- **Differential ingestion** with version tracking and unchanged document
  detection
- **Orphaned document cleanup** for efficient storage management
- **Metadata transformation** with schema validation
- **Retry logic** with exponential backoff
- **Progress tracking** and error reporting

## Installation

This package is intended for internal use within the Giselle monorepo.

## Usage

### Query Service

Search through vector embeddings with type-safe metadata filtering.

```typescript
import { createPostgresQueryService } from "@giselle-sdk/rag";
import { z } from "zod/v4";

// Define your metadata schema
const DocumentSchema = z.object({
  repositoryId: z.string(),
  filePath: z.string(),
  commitSha: z.string(),
});

type DocumentMetadata = z.infer<typeof DocumentSchema>;

// Create query service
const queryService = createPostgresQueryService<
  { repository: string; owner: string },
  DocumentMetadata
>({
  database: {
    connectionString: process.env.DATABASE_URL!,
    poolConfig: { max: 20 },
  },
  tableName: "document_embeddings",
  contextToFilter: async (context) => ({
    repository_id: `${context.owner}/${context.repository}`,
  }),
  metadataSchema: DocumentSchema,
});

// Search for relevant content
const results = await queryService.search(
  "function authentication",
  { repository: "myapp", owner: "myorg" },
  10,
);

results.forEach((result) => {
  console.log(`Similarity: ${result.similarity.toFixed(3)}`);
  console.log(`File: ${result.metadata.filePath}`);
  console.log(`Content: ${result.chunk.content.substring(0, 100)}...`);
});
```

### Ingest Pipeline

Process and store documents with automatic chunking and embedding.

```typescript
import {
  createPipeline,
  createPostgresChunkStore,
  type Document,
  type DocumentLoader,
} from "@giselle-sdk/rag";
import { z } from "zod/v4";

// Define schemas
const ChunkMetadataSchema = z.object({
  repositoryId: z.string(),
  filePath: z.string(),
  commitSha: z.string(),
});

type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;

// Document metadata type
type DocMetadata = {
  owner: string;
  repo: string;
  filePath: string;
  commitSha: string;
};

// Create chunk store
const chunkStore = createPostgresChunkStore<ChunkMetadata>({
  database: {
    connectionString: process.env.DATABASE_URL!,
    poolConfig: { max: 20 },
  },
  tableName: "document_embeddings",
  metadataSchema: ChunkMetadataSchema,
  staticContext: { processed_at: new Date().toISOString() },
});

// Create document loader with metadata support
const documentLoader: DocumentLoader<DocMetadata> = {
  async *loadMetadata(): AsyncIterable<DocMetadata> {
    // Load lightweight metadata for version checking
    yield {
      owner: "myorg",
      repo: "myrepo",
      filePath: "src/example.ts",
      commitSha: "abc123",
    };
  },

  async loadDocument(
    metadata: DocMetadata,
  ): Promise<Document<DocMetadata> | null> {
    // Load full document content based on metadata
    return {
      content: "Example document content...",
      metadata: metadata,
    };
  },
};

// additional data for chunk metadata
const repositoryId = "myorg/myrepo";

// Create ingest pipeline function with version tracking
const ingest = createPipeline({
  documentLoader,
  chunkStore,
  documentKey: (doc) => doc.metadata.filePath,
  metadataTransform: (documentMetadata) => ({
    repositoryId,
    filePath: documentMetadata.filePath,
    commitSha: documentMetadata.commitSha,
  }),
  documentVersion: (doc) => doc.metadata.commitSha, // Enable differential ingestion
  maxBatchSize: 50,
  onProgress: (progress) => {
    console.log(`Processed: ${progress.processedDocuments}`);
  },
});

// Run ingestion
const result = await ingest({});
console.log(`Successfully processed ${result.successfulDocuments} documents`);
```

## API

### Query Service

The query service returns an array of `QueryResult` objects:

```typescript
interface QueryResult<TMetadata> {
  chunk: {
    documentKey: string;
    content: string;
    index: number;
  };
  similarity: number;
  metadata: TMetadata;
}
```

### Ingest Pipeline

The ingest pipeline returns an `IngestResult`:

```typescript
interface IngestResult {
  totalDocuments: number;
  successfulDocuments: number;
  failedDocuments: number;
  errors: Array<{
    document: string;
    error: Error;
  }>;
}
```

### Document Loader

Document loaders must implement this interface:

```typescript
interface DocumentLoader<TMetadata> {
  // Load lightweight metadata for version checking
  loadMetadata(): AsyncIterable<TMetadata>;

  // Load full document content based on metadata
  loadDocument(
    metadata: TMetadata,
  ): Promise<Document<TMetadata> | null>;
}
```

### Core API

#### Factory Functions

- `createPipeline<TDocMetadata, TStore>(options)` - Creates a document
  processing pipeline function with automatic chunking and embedding. The chunk
  metadata type is inferred from the provided chunk store for type safety
- `createPostgresQueryService<TContext, TMetadata>(config)` - Creates a
  PostgreSQL-based query service
- `createPostgresChunkStore<TMetadata>(config)` - Creates a PostgreSQL-based
  chunk store
- `createDefaultEmbedder()` - Creates OpenAI embedder with default settings
- `createDefaultChunker()` - Creates line-based chunker with default settings
- `createOpenAIEmbedder(config)` - Creates OpenAI embedder with custom
  configuration
- `createLineChunker(options)` - Creates line-based chunker with custom options
- `createColumnMapping(options)` - Creates database column mapping

#### Chunk Store Methods

- `insert(documentKey, chunks, metadata)` - Insert chunks for a document
- `delete(documentKey)` - Delete all chunks for a document
- `deleteBatch(documentKeys)` - Delete chunks for multiple documents
- `getDocumentVersions()` - Get all document keys and their versions

## Environment Variables

- `OPENAI_API_KEY`: Required for the default OpenAI embedder
- `DATABASE_URL`: PostgreSQL connection string with pgvector extension

## Advanced Features

### Error Handling

The package provides structured error types:

- `OperationError` - General operation failures
- `DatabaseError` - Database-related errors
- `ValidationError` - Schema validation errors
- `ConfigurationError` - Configuration issues

### Connection Pool Management

Use `PoolManager` for efficient connection management:

```typescript
import { PoolManager } from "@giselle-sdk/rag";

const poolManager = new PoolManager();
const pool = poolManager.getPool(connectionString, poolConfig);
```

## Development

- **Build:** `pnpm build`
- **Type Check:** `pnpm check-types`
- **Format:** `pnpm format`
- **Test:** `pnpm test`
- **Clean:** `pnpm clean`

## Testing

Uses [Vitest](https://vitest.dev/):

```sh
pnpm test
```
