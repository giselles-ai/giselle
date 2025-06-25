import type { ChunkWithEmbedding } from "../chunk-store/types";
import type { ChunkerFunction } from "../chunker/types";
import type { EmbedderFunction } from "../embedder/types";

/**
 * Create chunks with embeddings from document content
 */
export async function embedContent(
	content: string,
	chunker: ChunkerFunction,
	embedder: EmbedderFunction,
	maxBatchSize: number,
): Promise<ChunkWithEmbedding[]> {
	const chunkTexts = chunker(content);
	const chunks: ChunkWithEmbedding[] = [];

	for (let i = 0; i < chunkTexts.length; i += maxBatchSize) {
		const batch = chunkTexts.slice(i, i + maxBatchSize);
		const embeddings = await embedder.embedMany(batch);

		for (let j = 0; j < batch.length; j++) {
			chunks.push({
				content: batch[j],
				index: i + j,
				embedding: embeddings[j],
			});
		}
	}

	return chunks;
}
