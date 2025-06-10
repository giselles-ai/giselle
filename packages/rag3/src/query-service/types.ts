import type { Chunk } from "../chunk-store/types";

export interface QueryResult<
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
	chunk: Chunk;
	similarity: number;
	metadata: TMetadata;
}

export interface QueryService<
	TContext,
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
	/**
	 * vector similarity search
	 * @param query search query
	 * @param context search context (filtering)
	 * @param limit maximum number of results
	 */
	search(
		query: string,
		context: TContext,
		limit?: number,
	): Promise<QueryResult<TMetadata>[]>;
}
