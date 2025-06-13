# @giselle-sdk/rag2

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
- **Metadata transformation** with schema validation
- **Retry logic** with exponential backoff
- **Progress tracking** and error reporting
- **Transaction safety** with automatic rollback

## Installation

This package is intended for internal use within the Giselle monorepo.

## Usage

### Query Service

Search through vector embeddings with type-safe metadata filtering.

```typescript
import { createQueryService } from "@giselle-sdk/rag2";
import { z } from "zod/v4";

// Define your metadata schema
const DocumentSchema = z.object({
  repositoryId: z.string(),
  filePath: z.string(),
  commitSha: z.string(),
});

type DocumentMetadata = z.infer<typeof DocumentSchema>;

// Create query service
const queryService = createQueryService<
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
  createChunkStore,
  createIngestPipeline,
  type Document,
} from "@giselle-sdk/rag2";
import { z } from "zod/v4";

// Define schemas
const ChunkMetadataSchema = z.object({
  repositoryId: z.string(),
  filePath: z.string(),
  commitSha: z.string(),
});

type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;

// Create chunk store
const chunkStore = createChunkStore<ChunkMetadata>({
  database: {
    connectionString: process.env.DATABASE_URL!,
    poolConfig: { max: 20 },
  },
  tableName: "document_embeddings",
  metadataSchema: ChunkMetadataSchema,
  staticContext: { processed_at: new Date().toISOString() },
});

const DocumentMetadata = {
  owner: z.string(),
  repo: z.string(),
  filePath: z.string(),
  commitSha: z.string(),
};

// Create document loader
const documentLoader = {
  async *load(params: unknown): AsyncIterable<Document<DocumentMetadata>> {
    // Your document loading logic here
    yield {
      content: "Example document content...",
      metadata: {
        owner: "owner",
        repo: "repo",
        filePath: "src/example.ts",
        commitSha: "abc123",
      },
    };
  },
};

// additional data for chunk metadata
const repositoryId = getRepositoryId();

// Create ingest pipeline
const pipeline = createIngestPipeline({
  documentLoader,
  chunkStore,
  documentKey: (doc) => doc.metadata.filePath,
  metadataTransform: (documentMetadata) => ({
    repository_id: repositoryId,
    filePath: documentMetadata.filePath,
    commitSha: documentMetadata.commitSha,
  }),
  options: {
    maxBatchSize: 50,
    onProgress: (progress) => {
      console.log(`Processed: ${progress.processedDocuments}`);
    },
  },
});

// Run ingestion
const result = await pipeline.ingest({});
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

### Factory Functions

- `createQueryService<TContext, TMetadata>(config)` - Creates a new query
  service
- `createChunkStore<TMetadata>(config)` - Creates a new chunk store
- `createIngestPipeline<TSource, TTarget>(config)` - Creates a new ingest
  pipeline
- `createDefaultEmbedder()` - Creates OpenAI embedder with default settings
- `createDefaultChunker()` - Creates line-based chunker with default settings
- `createColumnMapping(options)` - Creates database column mapping

## Environment Variables

- `OPENAI_API_KEY`: Required for the default OpenAI embedder
- `DATABASE_URL`: PostgreSQL connection string with pgvector extension

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