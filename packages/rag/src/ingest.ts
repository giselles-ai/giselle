import { createLineChunker } from "./chunk";
import { createOpenAIEmbedder } from "./embed";
import type {
	BaseEmbedding,
	Chunker,
	ContentLoader,
	Embedder,
	EmbeddingStore,
	EmbeddingTransformer,
	LoaderResult,
} from "./types";

/**
 * Main ingestion function - Loads content from ContentLoader, processes and stores it
 */
export async function ingest<
	T,
	LoaderMetadataType = Record<string, unknown>,
	StoreDataType = unknown,
>(params: {
	// Data source
	source: T;
	// Content loader
	loader: ContentLoader<T, LoaderMetadataType>;
	// Embedding store
	store: EmbeddingStore<StoreDataType>;
	// Transformation function
	transformEmbedding?: EmbeddingTransformer<LoaderMetadataType, StoreDataType>;
}): Promise<void> {
	const {
		source,
		loader,
		store,
		transformEmbedding = defaultTransform as EmbeddingTransformer<
			LoaderMetadataType,
			StoreDataType
		>,
	} = params;

	// Create chunker and embedder
	const chunker = createLineChunker();

	const embedder = createOpenAIEmbedder();

	// Set content size limit
	const maxContentSize = 1 * 1024 * 1024; // 1MB

	try {
		// Start ingestion process
		await store.startIngestion({ source });

		// Load documents from stream
		for await (const document of loader.loadStream(source)) {
			await processDocument(document, {
				chunker,
				embedder,
				store,
				transformEmbedding,
				maxContentSize,
			});
		}

		// Complete ingestion process
		await store.completeIngestion({ source });
	} catch (error) {
		// Error handling
		if (error instanceof Error) {
			await store.failIngestion({ source }, error);
		} else {
			await store.failIngestion(
				{ source },
				new Error(`Unknown error: ${String(error)}`),
			);
		}
		throw error;
	}
}

// Process a single document
async function processDocument<LoaderMetadataType, StoreDataType>(
	document: LoaderResult<LoaderMetadataType>,
	params: {
		chunker: Chunker;
		embedder: Embedder;
		store: EmbeddingStore<StoreDataType>;
		transformEmbedding: EmbeddingTransformer<LoaderMetadataType, StoreDataType>;
		maxContentSize: number;
	},
): Promise<void> {
	const { chunker, embedder, store, transformEmbedding, maxContentSize } =
		params;
	const { content, metadata } = document;

	// Check content size
	if (content.length > maxContentSize) {
		throw new Error(
			`Content size is too large: ${content.length} bytes, maximum allowed: ${maxContentSize}`,
		);
	}

	// Process chunks
	for await (const chunk of chunker.chunk(content)) {
		// Skip empty chunks
		if (chunk.content.length === 0) {
			continue;
		}

		// Embed the chunk
		const embedding = await embedder.embed(chunk.content);

		// Create base embedding object
		const baseEmbedding: BaseEmbedding = {
			chunkContent: chunk.content,
			chunkIndex: chunk.index,
			embedding,
		};

		// Transform and store
		const storeData = transformEmbedding(baseEmbedding, metadata);
		await store.insertEmbedding(storeData);
	}
}

function defaultTransform<T>(
	baseEmbedding: BaseEmbedding,
	metadata: Record<string, unknown>,
): T {
	return {
		...baseEmbedding,
		metadata,
	} as T;
}
