import type { z } from "zod/v4";
import { createLineChunker } from "../chunkers/line-chunker";
import { createOpenAIEmbedder } from "../embedders/openai-embedder";
import { ProcessingError, ValidationError, wrapError } from "../errors";
import type { ChunkStore } from "../stores/interfaces";
import type {
	ChunkWithEmbedding,
	Chunker,
	DocumentLoader,
	DocumentSource,
	Embedder,
} from "../types";

export interface IngestionConfig {
	chunking?: {
		maxLines?: number;
		overlap?: number;
		maxChars?: number;
	};
	embedder?: {
		provider?: "openai";
		model?: string;
	};
}

// Pipeline handles orchestration: Document → Chunk → ChunkWithEmbedding → DB
export class IngestionPipeline {
	constructor(
		private chunker: Chunker,
		private embedder: Embedder,
	) {}

	async run<
		TSource extends DocumentSource,
		TChunk extends z.ZodTypeAny = z.ZodTypeAny,
	>(params: {
		source: TSource;
		loader: DocumentLoader<TSource>;
		chunkStore: ChunkStore<z.ZodTypeAny, TChunk>;
	}): Promise<void> {
		const { source, loader, chunkStore } = params;

		try {
			// Step 1: Load documents from source
			for await (const document of loader.loadStream(source)) {
				// Step 2: Delete existing chunks for this document
				// ChunkStore handles metadata validation internally
				await chunkStore.deleteByDocumentKey(document.metadata);

				// Step 3: Split document into chunks
				for (const chunk of this.chunker.chunk(document.content)) {
					// Skip empty chunks
					if (chunk.content.trim().length === 0) {
						continue;
					}

					// Step 4: Add embedding to chunk
					const embedding = await this.embedder.embed(chunk.content);
					const chunkWithEmbedding: ChunkWithEmbedding = {
						...chunk,
						embedding,
					};

					// Step 5: Compose raw chunk data
					const rawChunkData = {
						...chunkWithEmbedding,
						...document.metadata,
					};

					// Step 6: Store to database - ChunkStore handles validation & conversion
					await chunkStore.insert(rawChunkData);
				}
			}
		} catch (error) {
			// Re-throw known errors as-is
			if (
				error instanceof ValidationError ||
				error instanceof ProcessingError
			) {
				throw error;
			}

			// Wrap unknown errors
			throw wrapError(error, "Ingestion pipeline failed");
		}
	}
}

export function createIngestionPipeline(
	config: IngestionConfig = {},
): IngestionPipeline {
	const chunker = createChunker(config.chunking);
	const embedder = createEmbedder(config.embedder);

	return new IngestionPipeline(chunker, embedder);
}

function createChunker(config?: IngestionConfig["chunking"]): Chunker {
	return createLineChunker({
		maxLines: config?.maxLines,
		overlap: config?.overlap,
		maxChars: config?.maxChars,
	});
}

function createEmbedder(config?: IngestionConfig["embedder"]): Embedder {
	const provider = config?.provider ?? "openai";

	switch (provider) {
		case "openai":
			return createOpenAIEmbedder(config?.model);
		default: {
			const _exhaustiveCheck: never = provider;
			throw new Error(`Unsupported embedder provider: ${_exhaustiveCheck}`);
		}
	}
}
