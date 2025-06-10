# RAG3 Migration Guide

This guide helps you upgrade your RAG3 usage to take advantage of the new features: default configurations, enhanced type safety, and improved error handling.

## Key Improvements

1. **Default Configurations**: Preset schemas and simplified setup
2. **Enhanced Type Safety**: Better TypeScript integration with Zod validation
3. **Improved Error Handling**: Structured errors with detailed context
4. **Factory Functions**: Simplified initialization for common use cases

## Migration Examples

### Before: Manual Configuration

```typescript
// Old way - lots of boilerplate
import { PostgresChunkStore, PostgresQueryService } from "@giselle/rag3";

const store = new PostgresChunkStore({
  database: { connectionString: "..." },
  tableName: "chunks",
  columnMapping: {
    documentKey: "document_key",
    content: "content", 
    index: "index",
    embedding: "embedding",
    title: "title",
    author: "author",
    createdAt: "created_at",
    tags: "tags",
    // ... all fields manually defined
  },
});

const queryService = new PostgresQueryService({
  database: { connectionString: "..." },
  tableName: "chunks",
  embedder: myEmbedder,
  columnMapping: {
    // ... same mapping again
  },
  contextToFilter: (context) => ({ workspace_id: context.workspaceId }),
});
```

### After: Using Presets

```typescript
// New way - much simpler
import { createDocumentRAG } from "@giselle/rag3";

const { store, queryService } = createDocumentRAG({
  database: { connectionString: "..." },
  tableName: "chunks",
  embedder: myEmbedder,
  // contextToFilter is optional - uses sensible defaults
});
```

### Before: Basic Error Handling

```typescript
// Old way - basic error handling
try {
  await store.insert(documentKey, chunks, metadata);
} catch (error) {
  console.error("Insert failed:", error.message);
  // Limited information about what went wrong
}
```

### After: Structured Error Handling

```typescript
// New way - detailed error handling
import { handleError, isErrorCategory, ValidationError } from "@giselle/rag3";

try {
  await store.insert(documentKey, chunks, metadata);
} catch (error) {
  if (isErrorCategory(error, "validation")) {
    console.log("Validation failed:");
    error.validationDetails.forEach(detail => {
      console.log(`  ${detail.path}: ${detail.message}`);
    });
  } else {
    handleError(error, {
      CONNECTION_FAILED: (dbError) => {
        console.log("Database connection failed:", dbError.context);
      },
      TRANSACTION_FAILED: (dbError) => {
        console.log("Transaction failed:", dbError.context);
      },
      default: (unknownError) => {
        console.log("Unexpected error:", unknownError);
      },
    });
  }
}
```

## Step-by-Step Migration

### 1. Update Imports

```typescript
// Add new imports for enhanced features
import {
  createChunkStore,
  createQueryService,
  createDocumentRAG,
  createGitHubRAG,
  ValidationError,
  DatabaseError,
  handleError,
  isErrorCategory,
} from "@giselle/rag3";
```

### 2. Choose Your Migration Path

#### Option A: Use Presets (Recommended)

If your metadata matches common patterns:

```typescript
// Document management
const { store, queryService } = createDocumentRAG({
  database: { connectionString: process.env.DATABASE_URL },
  tableName: "documents",
  embedder: myEmbedder,
});

// GitHub integration  
const { store, queryService } = createGitHubRAG({
  database: { connectionString: process.env.DATABASE_URL },
  tableName: "github_files", 
  embedder: myEmbedder,
});
```

#### Option B: Use Factory Functions with Custom Schema

For custom metadata structures:

```typescript
const MyMetadataSchema = z.object({
  productId: z.string(),
  category: z.string(),
  price: z.number(),
  inStock: z.boolean(),
});

const store = createChunkStore({
  database: { connectionString: process.env.DATABASE_URL },
  tableName: "products",
  metadataSchema: MyMetadataSchema, // Automatic validation
  // columnMapping auto-generated from schema
});
```

#### Option C: Gradual Migration

Keep existing setup but add validation:

```typescript
// Add validation to existing setup
const store = new PostgresChunkStore({
  database: { connectionString: "..." },
  tableName: "chunks",
  columnMapping: existingMapping,
  metadataSchema: MyMetadataSchema, // Add this line
});
```

### 3. Update Error Handling

Replace basic try/catch with structured error handling:

```typescript
// Before
try {
  await operation();
} catch (error) {
  console.error(error.message);
}

// After
try {
  await operation();
} catch (error) {
  handleError(error, {
    VALIDATION_FAILED: (validationError) => {
      // Handle validation errors with detailed info
      console.log("Validation failed:", validationError.validationDetails);
    },
    CONNECTION_FAILED: (dbError) => {
      // Handle database connection issues
      console.log("Database connection failed:", dbError.context);
    },
    RATE_LIMIT_EXCEEDED: (embeddingError) => {
      // Handle embedding API rate limits
      const retryAfter = embeddingError.context?.retryAfter;
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    },
    default: (unknownError) => {
      console.error("Unexpected error:", unknownError);
    },
  });
}
```

### 4. Update Type Definitions

Take advantage of improved type inference:

```typescript
// Before - manual type definitions
interface MyMetadata {
  title: string;
  author?: string;
  tags: string[];
}

// After - inferred from Zod schema
const MyMetadataSchema = z.object({
  title: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()),
});

type MyMetadata = z.infer<typeof MyMetadataSchema>; // Auto-generated
```

## Breaking Changes

### 1. ValidationError Constructor

```typescript
// Before
new ValidationError("message", errorData);

// After
ValidationError.fromZodError(zodError, context);
```

### 2. DatabaseError Constructor

```typescript
// Before
new DatabaseError("message", cause);

// After
DatabaseError.connectionFailed(cause, context);
DatabaseError.queryFailed(query, cause, context);
DatabaseError.transactionFailed(operation, cause, context);
```

### 3. Error Properties

Errors now have additional structured properties:

```typescript
// New properties available
error.code;        // Specific error code
error.category;    // Error category
error.context;     // Additional context
error.toJSON();    // Structured error data
```

## Best Practices

### 1. Use Presets When Possible

Presets provide tested configurations and sensible defaults:

```typescript
// Good
const rag = createDocumentRAG({ ... });

// Less ideal (unless you need custom behavior)
const store = new PostgresChunkStore({ ... });
```

### 2. Define Schemas with Zod

Zod schemas provide runtime validation and type safety:

```typescript
// Good - validated at runtime
const MetadataSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
});

// Less safe - only compile-time checking
interface Metadata {
  title: string;
  price: number;
}
```

### 3. Use Structured Error Handling

Take advantage of detailed error information:

```typescript
// Good - specific error handling
handleError(error, {
  VALIDATION_FAILED: handleValidation,
  CONNECTION_FAILED: handleConnection,
  default: handleUnknown,
});

// Less informative
catch (error) {
  console.error(error.message);
}
```

### 4. Leverage Type Inference

Let TypeScript infer types from your configuration:

```typescript
// Good - types inferred automatically
const store = createChunkStore({
  preset: "document", // TypeScript knows this returns DocumentMetadata
});

// Redundant type annotations not needed
const results = await queryService.search("query", {}); 
// TypeScript knows results have DocumentMetadata
```

## Testing Your Migration

1. **Type Checking**: Ensure TypeScript compilation passes
2. **Runtime Validation**: Test with invalid data to verify validation works
3. **Error Scenarios**: Test error handling with various failure modes
4. **Performance**: Verify no performance regression

```typescript
// Test validation
try {
  await store.insert("doc", [], { invalid: "data" });
  console.error("Should have thrown validation error");
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("✓ Validation working correctly");
  }
}

// Test error handling
try {
  await store.insert("doc", [], validData);
} catch (error) {
  handleError(error, {
    CONNECTION_FAILED: () => console.log("✓ Connection error handled"),
    default: () => console.log("✓ Default error handled"),
  });
}
```

## Getting Help

- Check the examples in `src/examples/usage-examples.ts`
- Review test files for usage patterns
- The new error system provides detailed context to help debug issues

## Rollback Plan

If you need to rollback:

1. Remove `metadataSchema` from existing configurations
2. Replace factory functions with direct class instantiation
3. Revert to basic error handling

The new features are mostly additive, so gradual adoption is possible.