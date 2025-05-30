import { z } from "zod/v4";

// Base document source schema (minimal)
export const BaseDocumentSource = z.object({
	type: z.string(),
});
export type DocumentSource = z.infer<typeof BaseDocumentSource>;

// Base document metadata (must be extended with specific type discriminator)
export const DocumentMetadata = z.object({
	type: z.string(), // discriminator field
});
export type DocumentMetadata = z.infer<typeof DocumentMetadata>;

// DB value types (avoiding unknown) - exported for potential future use
export const DbValue = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
	z.date(),
	z.array(z.number()),
]);
export type DbValue = z.infer<typeof DbValue>;

/**
 * Type guard function to check if a value is DbValue-compatible.
 * Provides compile-time type safety without throwing errors.
 */
export function isDbValue(value: unknown): value is DbValue {
	return DbValue.safeParse(value).success;
}

// Document = Single resource loaded by Loader (entire file, etc.)
export const Document = z.object({
	content: z.string().min(1),
	metadata: DocumentMetadata,
});
export type Document = z.infer<typeof Document>;

// Chunk = Fragment split by Chunker
export const Chunk = z.object({
	content: z.string().min(1),
	index: z.number().min(0),
});
export type Chunk = z.infer<typeof Chunk>;

// ChunkWithEmbedding = Chunk processed by Embedder
export const ChunkWithEmbedding = Chunk.extend({
	embedding: z.array(z.number()).min(1), // At least one dimension
});
export type ChunkWithEmbedding = z.infer<typeof ChunkWithEmbedding>;

// Chunk with metadata for database storage (ChunkWithEmbedding + metadata)
export type ChunkWithMetadata<T extends DocumentMetadata = DocumentMetadata> =
	ChunkWithEmbedding & T;

// Query result interface (generic)
export type QueryResult<T extends DocumentMetadata = DocumentMetadata> = {
	metadata: T;
	chunk: Chunk;
	similarity: number;
};

// Document Loader interface - returns documents (content + metadata)
export interface DocumentLoader<TSource extends DocumentSource> {
	// Load documents from source
	loadStream(source: TSource): AsyncIterable<Document>;

	// Zod validation
	validateSource(source: unknown): TSource;
}

// Chunker interface
export interface Chunker {
	chunk(content: string): Generator<Chunk, void, unknown>;
}

// Embedder interface
export interface Embedder {
	embed(text: string): Promise<number[]>;
}

// GitHub-specific types are now in ./github/types.ts
