# @giselle-sdk/rag3

A production-ready RAG (Retrieval-Augmented Generation) system built with TypeScript, PostgreSQL, and pgvector. Designed for high performance, type safety, and modularity.

## Features

- **Type-safe** with full TypeScript support and Zod validation
- **Modular architecture** - use individual components or the full pipeline
- **PostgreSQL + pgvector** for high-performance vector storage and search
- **Multiple embedding providers** (OpenAI, with extensible interface)
- **Flexible chunking strategies** with configurable overlap and sizing
- **Comprehensive error handling** with structured error types
- **Production-ready** with connection pooling, retry logic, and monitoring
- **Metadata management** with customizable schemas and column mapping

## Quick Start

### Installation

```bash
npm install @giselle-sdk/rag3
# or
yarn add @giselle-sdk/rag3
# or
pnpm add @giselle-sdk/rag3
```

### Basic Usage

```typescript
import {
  createChunkStore,
  createIngestPipeline,
  createQueryService,
} from "@giselle-sdk/rag3";
import { z } from "zod/v4";

// Define your metadata schema
const DocumentSchema = z.object({
  title: z.string(),
  author: z.string(),
  publishedAt: z.date(),
  tags: z.array(z.string()),
});

type DocumentMetadata = z.infer<typeof DocumentSchema>;

// Setup database connection
const database = {
  connectionString: process.env.DATABASE_URL!,
  poolConfig: { max: 20 }
};

// Create chunk store
const chunkStore = createChunkStore<DocumentMetadata>({
  database,
  tableName: "document_chunks",
  metadataSchema: DocumentSchema,
});

// Create ingest pipeline
const pipeline = createIngestPipeline({
  documentLoader: yourDocumentLoader,
  chunkStore,
  documentKey: (doc) => doc.metadata.title,
  metadataTransform: (metadata) => metadata,
});

// Ingest documents
const result = await pipeline.ingest({});
console.log(`Processed ${result.processedDocuments} documents`);

// Create query service for searching
const queryService = createQueryService({
  database,
  tableName: "document_chunks",
  contextToFilter: async (context) => ({
    author: context.authorFilter,
  }),
  metadataSchema: DocumentSchema,
});

// Search for relevant chunks
const results = await queryService.search("machine learning concepts", {
  authorFilter: "John Doe"
}, 5);

results.forEach(result => {
  console.log(`Similarity: ${result.similarity.toFixed(3)}`);
  console.log(`Content: ${result.chunk.content.substring(0, 100)}...`);
  console.log(`Author: ${result.metadata.author}`);
});
```

## Architecture

### Core Components

#### 1. IngestPipeline
Orchestrates the complete document processing workflow:

```typescript
interface IngestPipelineConfig<TSourceMetadata, TTargetMetadata> {
  documentLoader: DocumentLoader<TSourceMetadata>;
  chunker?: Chunker;
  embedder?: Embedder;
  chunkStore: ChunkStore<TTargetMetadata>;
  documentKey: (document: Document<TSourceMetadata>) => string;
  metadataTransform: (metadata: TSourceMetadata) => TTargetMetadata;
  options?: {
    batchSize?: number;
    onProgress?: (progress: IngestProgress) => void;
  };
}
```

#### 2. ChunkStore
Handles storage and retrieval of document chunks:

```typescript
interface ChunkStore<TMetadata> {
  insert(
    documentKey: string,
    chunks: ChunkWithEmbedding[],
    metadata: TMetadata
  ): Promise<void>;
  deleteByDocumentKey(documentKey: string): Promise<void>;
}
```

#### 3. QueryService
Performs vector similarity search with contextual filtering:

```typescript
interface QueryService<TContext, TMetadata> {
  search(
    query: string,
    context: TContext,
    limit?: number
  ): Promise<QueryResult<TMetadata>[]>;
}
```

#### 4. Document Loader
Loads documents from various sources:

```typescript
interface DocumentLoader<TMetadata> {
  load(params: DocumentLoaderParams): AsyncIterable<Document<TMetadata>>;
}

interface Document<TMetadata> {
  content: string;
  metadata: TMetadata;
}
```

### Chunking Strategies

#### LineChunker
Splits text by lines with character limits and overlap:

```typescript
const chunker = new LineChunker({
  maxLines: 150,     // Maximum lines per chunk
  overlap: 30,       // Lines to overlap between chunks
  maxChars: 10000,   // Maximum characters per chunk
});

const chunks = chunker.chunk(longText);
```

### Embedding Providers

#### OpenAI Embedder
```typescript
const embedder = new OpenAIEmbedder({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "text-embedding-3-small", // or "text-embedding-3-large"
  maxRetries: 3,
});

// Single embedding
const embedding = await embedder.embed("some text");

// Batch embeddings
const embeddings = await embedder.embedMany(["text1", "text2", "text3"]);
```

## Database Setup

### Prerequisites
- PostgreSQL 12+ with pgvector extension
- Node.js 18+

### Schema Creation

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Example table for document chunks
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  
  -- Required columns (mapped via ColumnMapping)
  document_key TEXT NOT NULL,
  content TEXT NOT NULL,
  index INTEGER NOT NULL,
  embedding VECTOR(1536) NOT NULL, -- OpenAI embedding dimensions
  
  -- Custom metadata columns
  title TEXT,
  author TEXT,
  published_at TIMESTAMP,
  tags TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create vector similarity index
CREATE INDEX document_chunks_embedding_cosine_idx
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Create filtering indexes
CREATE INDEX document_chunks_author_idx ON document_chunks (author);
CREATE INDEX document_chunks_published_at_idx ON document_chunks (published_at);
```

### Column Mapping

Map TypeScript fields to database columns:

```typescript
const columnMapping = createColumnMapping({
  metadataSchema: DocumentSchema,
  requiredColumnOverrides: {
    documentKey: "document_key",
    content: "content", 
    index: "index",
    embedding: "embedding"
  },
  metadataColumnOverrides: {
    publishedAt: "published_at" // Maps camelCase to snake_case
  }
});
```

## Error Handling

The package provides comprehensive error handling with structured error types:

### Error Categories

```typescript
import {
  DatabaseError,
  EmbeddingError,
  ValidationError,
  handleError,
  isErrorCode
} from "@giselle-sdk/rag3";

try {
  await pipeline.ingest({});
} catch (error) {
  handleError(error, {
    VALIDATION_FAILED: (err) => {
      console.log("Validation error:", err.zodError);
    },
    CONNECTION_FAILED: (err) => {
      console.log("Database connection failed:", err.context);
    },
    RATE_LIMIT_EXCEEDED: (err) => {
      console.log("Rate limited, retry after:", err.context?.retryAfter);
    },
    default: (err) => {
      console.log("Unexpected error:", err.message);
    }
  });
}
```

### Error Types

- **ValidationError**: Zod validation failures with detailed field information
- **DatabaseError**: PostgreSQL connection and query failures
- **EmbeddingError**: API rate limits, network issues, invalid inputs
- **ConfigurationError**: Missing environment variables, invalid configurations

## Advanced Usage

### Custom Document Loader

```typescript
class MyDocumentLoader implements DocumentLoader<MyMetadata> {
  async* load(params: { directory: string }): AsyncIterable<Document<MyMetadata>> {
    const files = await fs.readdir(params.directory);
    
    for (const file of files) {
      const content = await fs.readFile(path.join(params.directory, file), 'utf-8');
      yield {
        content,
        metadata: {
          filename: file,
          size: content.length,
          lastModified: new Date(),
        }
      };
    }
  }
}
```

### Custom Context Filtering

```typescript
const queryService = createQueryService({
  // ... other config
  contextToFilter: async (context: { userId: string; permissions: string[] }) => {
    // Complex authorization logic
    const userTeams = await getUserTeams(context.userId);
    
    return {
      $or: [
        { author: context.userId },
        { team_id: { $in: userTeams.map(t => t.id) } },
        { visibility: 'public' }
      ]
    };
  }
});
```

### Monitoring and Observability

```typescript
const pipeline = createIngestPipeline({
  // ... config
  options: {
    onProgress: (progress) => {
      // Send metrics to your monitoring system
      metrics.gauge('rag.ingestion.progress', progress.processedDocuments / progress.totalDocuments);
      
      console.log(`Progress: ${progress.processedDocuments}/${progress.totalDocuments}`);
      if (progress.currentDocument) {
        console.log(`Processing: ${progress.currentDocument}`);
      }
    }
  }
});
```

## Performance Considerations

### Connection Pooling
```typescript
const database = {
  connectionString: process.env.DATABASE_URL!,
  poolConfig: {
    max: 20,                    // Maximum connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Connection timeout
  }
};
```

### Batch Processing
```typescript
const pipeline = createIngestPipeline({
  // ... config
  options: {
    batchSize: 50, // Process documents in batches of 50
  }
});
```

### Vector Index Optimization
```sql
-- Tune HNSW parameters for your use case
CREATE INDEX document_chunks_embedding_idx ON document_chunks 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
```

## API Reference

### Factory Functions
- `createChunkStore<TMetadata>(config)` - Create PostgreSQL chunk store
- `createQueryService<TContext, TMetadata>(config)` - Create query service
- `createIngestPipeline<TSource, TTarget>(config)` - Create ingestion pipeline
- `createDefaultEmbedder()` - Create OpenAI embedder with defaults
- `createDefaultChunker()` - Create line chunker with defaults

### Utilities
- `createColumnMapping(options)` - Generate column mapping from schema
- `validateMetadata(data, schema)` - Runtime metadata validation
- `handleError(error, handlers)` - Type-safe error handling

## TypeScript Support

The package is built with TypeScript-first design:

- Full type inference for metadata schemas
- Generic constraints prevent type errors
- Zod integration for runtime validation
- Comprehensive JSDoc documentation

```typescript
// Types are fully inferred
const results = await queryService.search(query, context);
// results is QueryResult<YourMetadataType>[]

// Type-safe metadata access
results.forEach(result => {
  console.log(result.metadata.title); // ✅ Type-safe
  console.log(result.metadata.invalid); // ❌ TypeScript error
});
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/giselles-ai/giselle/issues)
- Documentation: [API Reference](https://docs.giselles.ai/rag3)