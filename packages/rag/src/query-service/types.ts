import type { Chunk } from "../chunk-store/types";
import type { EmbeddingCompleteCallback } from "../embedder/types";

export interface QueryResult<
	TMetadata extends Record<string, unknown> = Record<string, never>,
> {
	chunk: Chunk;
	similarity: number;
	metadata: TMetadata;
	additional?: Record<string, unknown>;
}

export interface QueryService<
	TContext,
	TMetadata extends Record<string, unknown> = Record<string, never>,
> {
	/**
	 * vector similarity search
	 * @param query search query
	 * @param context search context (filtering)
	 * @param limit maximum number of results
	 * @param similarityThreshold minimum similarity score (optional)
	 * @param embeddingComplete callback invoked after embedding completion (optional)
	 * @param headers optional headers to pass to the embedding API (e.g., for AI Gateway)
	 */
	search(
		query: string,
		context: TContext,
		limit?: number,
		similarityThreshold?: number,
		embeddingComplete?: EmbeddingCompleteCallback,
		headers?: Record<string, string>,
	): Promise<QueryResult<TMetadata>[]>;
}
