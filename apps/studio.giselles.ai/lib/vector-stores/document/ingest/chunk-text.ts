import type { ChunkerFunction } from "@giselles-ai/rag";
import { createDefaultChunker } from "@giselles-ai/rag";

interface ChunkTextOptions {
	/**
	 * Custom chunker function. If not provided, uses the default chunker.
	 */
	chunker?: ChunkerFunction;
	/**
	 * Optional signal for aborting the operation
	 */
	signal?: AbortSignal;
}

interface ChunkTextResult {
	/**
	 * Array of text chunks
	 */
	chunks: string[];
	/**
	 * Number of chunks created
	 */
	chunkCount: number;
}

/**
 * Chunk text content into smaller pieces suitable for embedding
 *
 * Default configuration:
 * - maxLines: 150 lines per chunk
 * - overlap: 30 lines between chunks
 * - maxChars: 6000 characters per chunk
 *
 * @param text - The text content to chunk
 * @param options - Optional chunking configuration
 * @returns Array of text chunks with metadata
 */
export function chunkText(
	text: string,
	options?: ChunkTextOptions,
): ChunkTextResult {
	const { chunker, signal } = options ?? {};

	// Check for abort signal
	signal?.throwIfAborted();

	if (!text || text.trim().length === 0) {
		return {
			chunks: [],
			chunkCount: 0,
		};
	}

	// Use provided chunker or default
	const chunkFn = chunker ?? createDefaultChunker();

	// Chunk the text
	const chunks = chunkFn(text);

	// Filter out empty chunks
	const nonEmptyChunks = chunks.filter((chunk) => chunk.trim().length > 0);

	return {
		chunks: nonEmptyChunks,
		chunkCount: nonEmptyChunks.length,
	};
}
