# RAG2 - Retrieval-Augmented Generation Framework

A modern, type-safe, and extensible RAG (Retrieval-Augmented Generation)
framework built with TypeScript. RAG2 provides a unified metadata schema
approach that enables apps to define their own database designs while
maintaining type safety and reusability.

## 🎯 Design Philosophy

### Federated Unified Schema Approach

RAG2 implements a **Federated Unified Schema Approach** that balances:

- **Responsibility Separation**: Apps own their database design decisions
- **Type Safety**: Full TypeScript inference and validation throughout the
  pipeline
- **Unified Patterns**: Consistent metadata handling across different document
  types
- **Extensibility**: Easy to add new document sources and storage backends

### Architecture Principles

1. **Component-Based**: Pluggable chunkers, embedders, loaders, and stores
2. **Pipeline-Driven**: Clear data flow from Document → Chunk →
   ChunkWithEmbedding → Database
3. **CQRS-Based**: Separate write operations (ChunkStore) from read operations
   (QueryService)
4. **Metadata-First**: Unified metadata schema system for type-safe operations
5. **Simple Configuration**: Clean factory functions without complex classes

## 📐 Core Architecture

### Write Pipeline (Command Side)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DocumentLoader │────▶│     Chunker     │────▶│    Embedder     │────▶│   ChunkStore    │
│                 │    │                 │    │                 │    │   (Write Only)  │
│ GitHub, Notion, │    │  Line-based,    │    │ OpenAI, etc.    │    │ PostgreSQL,     │
│ Web, Files, etc.│    │  Semantic, etc. │    │                 │    │ Vector DBs, etc.│
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
   Document<TMetadata>      Chunk[]           ChunkWithEmbedding[]    ChunkWithMetadata<TMetadata>
```

### Read Pipeline (Query Side)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Question  │────▶│  QueryService   │────▶│  QueryResult[]  │
│                 │    │  (Read Only)    │    │                 │
│ "How to auth?"  │    │ Vector Search,  │    │ Ranked chunks   │
│                 │    │ Filtering, etc. │    │ with metadata   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Embedding Query    ──▶  Database Query     ──▶  Similarity Results
```

### CQRS Separation

- **ChunkStore** (Command): Handles `insert()`, `delete()` operations
- **QueryService** (Query): Handles `searchByQuestion()` operations
- **Shared**: Metadata schemas and type definitions

## 🧩 Core Components

### Type System

The foundation of RAG2 is a well-defined type system that ensures data integrity
throughout the pipeline:

```typescript
// Base types
type DocumentSource = { type: string };
type DocumentMetadata = { type: string };
type Document<T> = { content: string; metadata: T };
type Chunk = { content: string; index: number };
type ChunkWithEmbedding = Chunk & { embedding: number[] };
type ChunkWithMetadata<T> = ChunkWithEmbedding & T;
```

## 🛡️ Error Handling

RAG2 provides a comprehensive, standardized error handling system for robust
application development:

### Error Types

```typescript
import {
  APIError,
  ConfigurationError,
  DatabaseError,
  ProcessingError,
  ValidationError,
} from "@giselle-sdk/rag2";

// All errors extend RAGError with structured information
try {
  const chunkStore = createPostgresChunkStore(
    dbConfig,
    documentConfig,
    options,
  );
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation failed:", error.field, error.message);
  } else if (error instanceof DatabaseError) {
    console.log("Database error:", error.operation, error.message);
  }
}
```

### Error Categories

- **`ValidationError`**: Input validation failures (empty strings, invalid
  configurations)
- **`DatabaseError`**: Database operation failures (connection, query,
  transaction)
- **`APIError`**: External API failures (OpenAI, GitHub, authentication)
- **`ConfigurationError`**: Configuration and setup issues
- **`ProcessingError`**: Pipeline processing failures (chunking, embedding)

### Error Utilities

```typescript
import { isRAGError, wrapError } from "@giselle-sdk/rag2";

// Check if error is a RAG error
if (isRAGError(error)) {
  console.log("RAG Error:", error.toJSON()); // Structured logging
}

// Wrap external errors
try {
  await externalApiCall();
} catch (error) {
  throw wrapError(error, "Failed to call external API", "api_call");
}
```

## ⚡ Validation Philosophy

RAG2 uses **selective runtime validation** for optimal performance and developer
experience:

### Type-Guaranteed vs Runtime Validation

```typescript
// ✅ RAG2 validates only what TypeScript cannot guarantee
function createChunkStore(tableName: string, documentKey: keyof Metadata) {
  // Runtime validation for logical constraints TypeScript can't catch
  if (tableName.trim().length === 0) {
    throw new ValidationError("Table name cannot be empty");
  }

  // ❌ No validation needed - TypeScript guarantees these are correct types
  // if (typeof tableName !== 'string') // TypeScript already ensures this
  // if (documentKey === null) // TypeScript prevents null/undefined
}
```

### Validation Principles

1. **Type Safety First**: Leverage TypeScript's type system for compile-time
   guarantees
2. **Essential Logic Only**: Validate business rules TypeScript cannot express
3. **SQL Safety**: Protect against injection with parameter binding and
   identifier validation
4. **Performance Optimized**: Minimal runtime overhead

### SQL Identifier Validation

```typescript
import { validateSqlIdentifier } from "@giselle-sdk/rag2";

// Safely validate developer-provided SQL identifiers
const tableName = validateSqlIdentifier(userProvidedTableName);
// User data is always parameterized - no validation needed
```

## 🧹 Resource Management

RAG2 provides built-in resource management for database connections and other
resources:

### Automatic Cleanup

```typescript
// All stores and services implement dispose() for resource cleanup
const chunkStore = createPostgresChunkStore(dbConfig, documentConfig, options);
const queryService = createPostgresQueryService(
  dbConfig,
  documentConfig,
  options,
);

try {
  // Use stores and services
  await chunkStore.insert(chunkData);
  const results = await queryService.searchByQuestion(params);
} finally {
  // Always dispose resources in finally block
  await chunkStore.dispose();
  await queryService.dispose();
}
```

### Error-Safe Disposal

```typescript
// Disposal methods are designed to be safe even if called multiple times
// or when the service is in an error state
async function safeCleanup(services: Array<{ dispose(): Promise<void> }>) {
  await Promise.allSettled(services.map((service) => service.dispose()));
}

await safeCleanup([chunkStore, queryService]);
```

### Best Practices

1. **Always Call dispose()**: Ensures database connections are properly closed
2. **Use try/finally**: Guarantee cleanup even on errors
3. **Multiple dispose() calls are safe**: No need to track disposal state
4. **Use Promise.allSettled()**: For disposing multiple services safely

### Simple Configuration Pattern

The core innovation of RAG2 is the **simple configuration pattern** that
provides a clean, intuitive developer experience while maintaining complete type
safety and **separation of concerns**:

#### 🎯 Key Benefits

- **Simple Configuration**: Document types are pure configuration objects, not
  complex classes
- **Independent Factories**: Separate factory functions for chunk stores and
  query services
- **Type Safety**: Full TypeScript inference with runtime validation using Zod
  schemas
- **Apps only define metadata**: No need to know about RAG internals (`content`,
  `index`, `embedding`)
- **Automatic composition**: RAG2 automatically combines your metadata with
  chunk fields
- **Single source of truth**: One document type definition works with all
  factories
- **No cognitive load**: Simple factory functions with clear purposes

```typescript
// Apps define their own schemas using the simple configuration API
const GitHubBlob = defineDocumentType({
  name: "github-blob",
  schema: z.object({
    type: z.literal("github-blob"),
    path: z.string(),
    fileSha: z.string(),
    nodeId: z.string(),
    owner: z.string(),
    repo: z.string(),
    commitSha: z.string(),
  }),
  columns: {
    path: "path", // logical name → physical DB column
    fileSha: "file_sha", // apps control DB design
    nodeId: "node_id",
    owner: "owner",
    repo: "repo",
    commitSha: "commit_sha",
  },
});

// Simple factory functions - clear and focused:
// - createPostgresChunkStore() - For storage operations
// - createPostgresQueryService() - For query operations
// Note: Use separate loader classes (e.g., GitHubBlobLoader) for ingestion

// Type inference works perfectly:
type GitHubBlobMetadata = z.infer<typeof GitHubBlob.metadataSchema>;
// ^^ Correctly infers: { type: "github-blob"; path: string; fileSha: string; ... }

type GitHubBlobChunk = z.infer<typeof GitHubBlob.chunkSchema>;
// ^^ Correctly infers: { content: string; index: number; embedding: number[]; type: "github-blob"; path: string; ... }
```

#### ✅ What You Write vs. ❌ What You Don't Need to Write

```typescript
// ✅ You only define your business metadata with simple configuration
const GitHubBlob = defineDocumentType({
  name: "github-blob",
  schema: z.object({
    type: z.literal("github-blob"),
    path: z.string(),
    fileSha: z.string(),
    // ... your app-specific fields
  }),
  columns: {/* your DB design */},
});

// ✅ Clear, simple factory usage
const loader = new GitHubBlobLoader(octokitClient, {
  metadataSchema: GitHubBlob.metadataSchema,
});

// Individual factories for flexibility
const chunkStore = createPostgresChunkStore(dbConfig, GitHubBlob, {
  tableName: "embeddings",
  documentKey: "path",
  sourceScope: { repositoryId: 123 },
});
const queryService = createPostgresQueryService(dbConfig, GitHubBlob, {
  tableName: "embeddings",
});

// Individual factories provide maximum flexibility and clarity

// ❌ You DON'T need complex class methods or mixed responsibilities
// const chunkStore = GitHubBlob.createChunkStore(...);  // ❌ Old complex API
// const queryService = GitHubBlob.createQueryService(...); // ❌ Old complex API
```

### Document Loaders

Loaders are responsible for fetching and parsing documents from various sources:

```typescript
interface DocumentLoader<TSource, TMetadata> {
  loadStream(
    source: TSource,
  ): AsyncIterable<{ content: string; metadata: TMetadata }>;
  validateSource(source: unknown): TSource;
}
```

### Chunkers

Chunkers split documents into manageable pieces:

```typescript
interface Chunker {
  chunk(content: string): Generator<Chunk, void, unknown>;
}
```

### Embedders

Embedders convert text chunks into vector representations:

```typescript
interface Embedder {
  embed(text: string): Promise<number[]>;
}
```

### CQRS Architecture: Chunk Stores & Query Services

RAG2 implements **CQRS (Command Query Responsibility Segregation)** to separate
write and read operations, providing better scalability, maintainability, and
flexibility.

#### Chunk Stores (Write Side)

Chunk stores handle **write operations only** - persistence, updates, and
deletions:

```typescript
interface ChunkStore<T, TContext> {
  // sourceScope is configured at creation time (static)
  // additionalContext can be provided at runtime (dynamic)
  insert(data: T, additionalContext?: TContext): Promise<void>;
  deleteBySourceKey(sourceScope: TContext): Promise<void>;
  deleteByDocumentKey(
    metadata: DocumentMetadata,
    additionalContext?: TContext,
  ): Promise<void>;
}
```

#### Query Services (Read Side)

Query services handle **read operations only** - searching and retrieval:

```typescript
interface QueryService<M, TContext> {
  searchByQuestion(params: {
    question: string;
    limit: number;
    similarityThreshold: number;
    context: TContext; // Required context for filtering
  }): Promise<QueryResult<M>[]>;
}
```

#### CQRS Benefits in RAG2

1. **Responsibility Separation**: Write and read operations use different
   interfaces and implementations
2. **Independent Optimization**: Storage and query operations can be optimized
   separately
3. **Scalability**: Read and write sides can scale independently
4. **Flexibility**: Different storage backends for writes vs reads (e.g.,
   PostgreSQL for writes, specialized vector DB for reads)
5. **Type Safety**: Each side can have optimized type definitions for their
   specific use cases

## 🚀 Quick Start

### Basic Ingestion Pipeline

```typescript
import {
  createIngestionPipeline,
  createPostgresChunkStore,
  defineDocumentType,
  GitHubBlobLoader,
} from "@giselle-sdk/rag2";
import { z } from "zod/v4";

// 1. Define your document type (apps responsibility)
const GitHubBlob = defineDocumentType({
  name: "github-blob",
  schema: z.object({
    type: z.literal("github-blob"),
    path: z.string(),
    fileSha: z.string(),
    // ... other fields
  }),
  columns: {
    path: "path",
    fileSha: "file_sha", // Your DB design
    // ... other field mappings
  },
});

// 2. Create components using simple factory functions
const loader = new GitHubBlobLoader(octokitClient, {
  maxBlobSize: 1 * 1024 * 1024, // Type-safe options
  metadataSchema: GitHubBlob.metadataSchema, // Required parameter
});

const chunkStore = createPostgresChunkStore(
  { connectionString: dbUrl },
  GitHubBlob,
  {
    tableName: "my_embeddings",
    documentKey: "path", // Use path for incremental updates
    // Static source scope configured at creation time
    sourceScope: {
      repository_index_db_id: repositoryIndexDbId,
    },
  },
);

const pipeline = createIngestionPipeline({
  chunking: { maxLines: 150, overlap: 30 },
  embedder: { provider: "openai", model: "text-embedding-3-small" },
});

// 3. Run ingestion - sourceScope now handled internally by chunkStore
await pipeline.run({
  source: {
    type: "github-blob",
    owner: "user",
    repo: "repo",
    commitSha: "abc123",
  },
  loader,
  chunkStore, // Clean, focused interface
});

// Don't forget to clean up resources
await chunkStore.dispose();
```

### Querying

```typescript
// Create query service using factory function
const queryService = createPostgresQueryService(
  { connectionString: dbUrl },
  GitHubBlob,
  {
    tableName: "my_embeddings",
    // Filter resolver for app-specific filtering (optional)
    filterResolver: async (context) => ({
      repository_id: context.repositoryId,
    }),
  },
);

const results = await queryService.searchByQuestion({
  question: "How to implement auth?",
  limit: 5,
  similarityThreshold: 0.7,
  context: { repositoryId: 123 }, // Required context for filtering
});

// Clean up resources when done
await queryService.dispose();
```

### Convenience Function for Common Use Case

```typescript
// Create both chunk store and query service with shared configuration
const { chunkStore, queryService } = createPostgresStores(
  { connectionString: dbUrl },
  GitHubBlob,
  {
    tableName: "my_embeddings",
    documentKey: "path",
    sourceScope: { repository_index_db_id: repositoryIndexDbId },
    filterResolver: async (context) => ({
      repository_id: context.repositoryId,
    }),
  },
);

// Use both for ingestion and querying
await pipeline.run({ source, loader, chunkStore });
const results = await queryService.searchByQuestion({
  question,
  limit: 5,
  similarityThreshold: 0.7,
  context: { repositoryId: 123 },
});

// Important: Always dispose resources when done
await chunkStore.dispose();
await queryService.dispose();
```

## 🏗️ Extension Guide

### Adding a New Document Source (e.g., Notion)

#### 1. Define Source and Metadata Types

```typescript
// In your app or package
import { z } from "zod/v4";
import type { DocumentMetadata, DocumentSource } from "@giselle-sdk/rag2";

export const NotionPageSource = z.object({
  type: z.literal("notion-page"),
  pageId: z.string(),
  databaseId: z.string().optional(),
});
export type NotionPageSource = z.infer<typeof NotionPageSource>;

export interface NotionPageBasicMetadata extends DocumentMetadata {
  type: "notion-page";
  pageId: string;
  title: string;
  url: string;
  lastEditedTime: string;
  createdTime: string;
}
```

#### 2. Create the Loader

```typescript
import { DocumentLoader } from "@giselle-sdk/rag2";
import type { z } from "zod/v4";

export class NotionPageLoader<TMetadata extends DocumentMetadata>
  implements DocumentLoader<NotionPageSource, TMetadata> {
  constructor(
    private notionClient: Client,
    private options: {
      zodSchema: z.ZodSchema<TMetadata>;
    },
  ) {}

  async *loadStream(source: NotionPageSource): AsyncIterable<{
    content: string;
    metadata: TMetadata;
  }> {
    const { pageId } = source;

    // Fetch from Notion API
    const page = await this.notionClient.pages.retrieve({ page_id: pageId });
    const blocks = await this.notionClient.blocks.children.list({
      block_id: pageId,
    });

    // Convert blocks to markdown/text
    const content = await this.blocksToText(blocks.results);

    // Create basic metadata
    const basicMetadata = {
      type: "notion-page" as const,
      pageId: page.id,
      title: this.extractTitle(page),
      url: page.url,
      lastEditedTime: page.last_edited_time,
      createdTime: page.created_time,
    };

    // Transform using schema
    const metadata = this.options.zodSchema.parse(basicMetadata);

    yield { content, metadata };
  }

  validateSource(source: unknown): NotionPageSource {
    return NotionPageSource.parse(source);
  }
}
```

#### 3. Define App-Specific Schema

```typescript
// In your app
const NotionPage = defineDocumentType({
  name: "notion-page",
  schema: z.object({
    type: z.literal("notion-page"),
    pageId: z.string(),
    title: z.string(),
    url: z.string(),
    lastEditedTime: z.string(),
    createdTime: z.string(),
  }),
  columns: {
    pageId: "page_id", // Your DB column names
    title: "title",
    url: "url",
    lastEditedTime: "last_edited_time",
    createdTime: "created_time",
  },
});

export type NotionPageMetadata = z.infer<typeof NotionPage.metadataSchema>;
```

#### 4. Use in Pipeline

```typescript
const notionLoader = new NotionPageLoader(notionClient, {
  zodSchema: NotionPage.metadataSchema,
});

// Use individual factories for clear separation of concerns
const queryService = createPostgresQueryService(
  { connectionString: dbUrl },
  NotionPage,
  {
    tableName: "notion_embeddings",
    filterResolver: async (context) => ({
      workspace_id: context.workspaceId,
    }),
  },
);

// For write operations, create a separate chunk store
const notionChunkStore = createPostgresChunkStore(
  { connectionString: dbUrl },
  NotionPage,
  {
    tableName: "notion_embeddings",
    documentKey: "pageId",
    sourceScope: { workspace_id: getCurrentWorkspaceId() },
  },
);

await pipeline.run({
  source: { type: "notion-page", pageId: "abc123", databaseId: "def456" },
  loader: notionLoader,
  chunkStore: notionChunkStore,
});
```

### Custom Chunker

```typescript
import type { Chunk, Chunker } from "@giselle-sdk/rag2";

export class SemanticChunker implements Chunker {
  constructor(
    private options: {
      maxTokens: number;
      overlapTokens: number;
    },
  ) {}

  *chunk(content: string): Generator<Chunk, void, unknown> {
    // Implement semantic chunking logic
    const sentences = this.splitBySentence(content);
    const chunks = this.groupBySemantics(sentences);

    for (let i = 0; i < chunks.length; i++) {
      yield {
        content: chunks[i],
        index: i,
      };
    }
  }
}
```

### Custom Embedder

```typescript
import type { Embedder } from "@giselle-sdk/rag2";

export class HuggingFaceEmbedder implements Embedder {
  constructor(
    private options: {
      model: string;
      apiKey: string;
    },
  ) {}

  async embed(text: string): Promise<number[]> {
    // Call HuggingFace API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.options.model}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      },
    );

    return await response.json();
  }
}
```

## 📚 API Reference

### Core Functions

#### `defineDocumentType<TSchema>(config)`

Creates a document type configuration object for use with factory functions.

**Parameters:**

- `config.name`: Unique identifier for the document type
- `config.schema`: Zod schema defining the metadata structure
- `config.columns`: Record mapping logical field names to physical database
  column names

**Returns:** `DocumentTypeConfig<TSchema>` with properties:

- `name`: Document type name
- `metadataSchema`: Zod schema for metadata validation
- `chunkSchema`: Complete schema including chunk fields (content, index,
  embedding)
- `columns`: Field mapping configuration

#### `createPostgresChunkStore(dbConfig, documentConfig, options)`

Creates a PostgreSQL chunk store for write operations.

**Parameters:**

- `dbConfig`: PostgreSQL connection configuration
- `documentConfig`: Document type configuration from `defineDocumentType`
- `options.tableName`: Database table name
- `options.documentKey`: Metadata field used for document identification
- `options.sourceScope`: Static source scope for data isolation
- `options.embeddingColumnName?`: Custom embedding column name (optional)
- `options.columnConfig?`: Custom column configuration (optional)

**Returns:** `ChunkStore<ChunkWithMetadata<TMetadata>>` instance

#### `createPostgresQueryService(dbConfig, documentConfig, options)`

Creates a PostgreSQL query service for read operations.

**Parameters:**

- `dbConfig`: PostgreSQL connection configuration
- `documentConfig`: Document type configuration from `defineDocumentType`
- `options.tableName`: Database table name
- `options.filterResolver?`: Function to resolve query context to database
  filters
- `options.columnConfig?`: Custom column configuration (optional)

**Returns:** `QueryService<TMetadata, TContext>` instance

#### `createIngestionPipeline(config?)`

Creates a configurable ingestion pipeline.

**Parameters:**

- `config.chunking`: Chunking configuration
- `config.embedder`: Embedder configuration

**Returns:** `IngestionPipeline` instance

### Built-in Components

#### Chunkers

- `createLineChunker(options)`: Line-based chunking with overlap support

#### Embedders

- `createOpenAIEmbedder(model?)`: OpenAI embeddings (text-embedding-3-small
  default)

#### Chunk Stores (Write Side - CQRS)

- `PostgresChunkStore`: PostgreSQL-based vector storage with pgvector for write
  operations (insert, delete, dispose)

#### Query Services (Read Side - CQRS)

- `PostgresQueryService`: Type-safe vector similarity search and filtering for
  PostgreSQL (searchByQuestion, dispose)

#### Loaders

- `GitHubBlobLoader`: GitHub repository file loading with commit SHA support and
  metadata schema validation

## 🎯 Design Decisions & Best Practices

### Simple Configuration Pattern

RAG2 uses a simple configuration pattern instead of complex class hierarchies:

✅ **Why Simple Configuration?**

- **Clear Separation**: Configuration objects are separate from factory
  functions
- **Type Safety**: Full TypeScript inference without complex class methods
- **Flexibility**: Can use individual factories or convenience functions as
  needed
- **Testability**: Easy to mock and test individual components
- **Maintainability**: Simple functions are easier to understand and modify

✅ **Do:**

- Use `defineDocumentType()` to create configuration objects
- Use individual factory functions for maximum flexibility
- Use individual factories when you need fine-grained control
- Leverage TypeScript inference with `z.infer<typeof config.metadataSchema>`

❌ **Don't:**

- Try to instantiate document types as classes
- Mix configuration with business logic
- Skip type validation with Zod schemas

### CQRS (Command Query Responsibility Segregation)

RAG2 implements CQRS to separate write and read operations:

✅ **Why CQRS?**

- **Different Access Patterns**: Ingestion (writes) and querying (reads) have
  different performance characteristics
- **Independent Scaling**: Write and read operations can scale independently
- **Optimized Data Models**: Each side can optimize for its specific use case
- **Technology Flexibility**: Can use different storage technologies for reads
  vs writes

✅ **Do:**

- Use `ChunkStore` for all write operations (insert, delete)
- Use `QueryService` for all read operations (search, retrieval)
- Keep write and read models separate but connected through metadata schemas
- Optimize each side independently for their specific use cases

❌ **Don't:**

- Mix write and read operations in the same interface
- Use ChunkStore for querying operations
- Assume both sides need identical data models

### Metadata Schema Design

✅ **Do:**

- Define schemas in apps layer (your DB design responsibility)
- Use descriptive logical field names
- Map to your actual DB column names
- Leverage type inference

❌ **Don't:**

- Define DB-specific schemas in reusable packages
- Skip validation with Zod schemas
- Hardcode field mappings

## 🔍 Current Limitations & Future Improvements

### Known Limitations

#### **🔧 Implementation Limitations**

1. **Single Embedding Model per Pipeline**: Currently each pipeline instance
   supports one embedder
2. **Limited Built-in Chunkers**: Only line-based chunking available out of the
   box
3. **PostgreSQL Focus**: Primary support for PostgreSQL, other DBs need custom
   implementations
4. **Limited Vector Database Support**: Native support focused on PostgreSQL
   with pgvector
5. **Batch Processing**: No built-in batch optimization for large document sets

### Planned Improvements

#### **🚀 Future Features**

1. **Multi-Modal Support**: Support for image and audio embeddings
2. **Advanced Chunking**: Semantic and token-aware chunking strategies
3. **More Storage Backends**: Native support for Pinecone, Weaviate, etc.
4. **Streaming Optimization**: Better memory management for large documents
5. **Batch Processing**: Efficient batch embedding and storage operations
6. **Multi-Embedding Models**: Support for multiple embedding models in a single
   pipeline

## 🤝 Contributing

RAG2 is designed to be extensible. When contributing:

1. **Maintain Type Safety**: Ensure all new components are fully typed
2. **Follow Interface Patterns**: Implement standard interfaces for
   interoperability
3. **Add Tests**: Include unit tests for new components
4. **Update Documentation**: Keep this README updated with new features

## 📄 License

[Add your license information here]
