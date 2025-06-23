# Test Documentation

This is a sample markdown document for testing the LineChunker functionality.

## Introduction

The purpose of this document is to provide a realistic test fixture for chunking markdown content. It includes various markdown elements like headers, paragraphs, lists, and code blocks.

## Features

### Basic Text Processing

The chunker should handle regular paragraphs effectively. This includes:

- Short sentences
- Medium-length paragraphs with multiple sentences that explain concepts in detail
- Long paragraphs that might need to be split across chunks

### Code Blocks

Here's an example of TypeScript code:

```typescript
interface ChunkerOptions {
  maxLines: number;
  overlap: number;
  maxChars: number;
}

class Chunker {
  constructor(private options: ChunkerOptions) {}
  
  chunk(text: string): string[] {
    // Implementation details
    return [];
  }
}
```

### Lists and Enumerations

1. **Ordered lists** with various items
2. **Nested content** that includes:
   - Sub-items with details
   - Multiple levels of nesting
   - Different formatting styles
3. **Mixed content** combining text and code

### Tables

| Feature | Description | Status |
|---------|-------------|--------|
| Line-based chunking | Split by line count | ✓ |
| Character limit | Enforce max chars | ✓ |
| Overlap support | Configurable overlap | ✓ |

## Advanced Usage

### Configuration Examples

The chunker can be configured in various ways:

```typescript
// Default configuration
const chunker1 = new LineChunker();

// Custom line limit
const chunker2 = new LineChunker({
  maxLines: 50,
  overlap: 10
});

// Character-based limits
const chunker3 = new LineChunker({
  maxLines: 100,
  maxChars: 1000,
  overlap: 20
});
```

### Best Practices

When using the chunker, consider these guidelines:

1. **Choose appropriate chunk sizes** based on your use case
2. **Set overlap** to maintain context between chunks
3. **Monitor performance** with large documents
4. **Test edge cases** thoroughly

## Conclusion

This test document covers various markdown elements and should provide good coverage for testing the chunking algorithm. The chunker should handle all these elements gracefully while respecting the configured limits.