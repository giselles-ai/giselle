import type { EmbeddingProfileId } from "@giselles-ai/protocol";
import { EMBEDDING_PROFILES } from "@giselles-ai/protocol";
import type {
	EmbedderFunction,
	EmbeddingCompleteCallback,
} from "@giselles-ai/rag";
import { createEmbedderFromProfile } from "@giselles-ai/rag";

interface GenerateEmbeddingsOptions {
	chunks: string[];
	embeddingProfileId: EmbeddingProfileId;
	maxBatchSize?: number;
	signal?: AbortSignal;
	embeddingComplete?: EmbeddingCompleteCallback;
}

interface EmbeddingResult {
	chunkIndex: number;
	content: string;
	embedding: number[];
}

interface GenerateEmbeddingsResult {
	embeddings: EmbeddingResult[];
	embeddingCount: number;
	dimensions: number;
}

const DEFAULT_MAX_BATCH_SIZE = 100;

type GenerateEmbeddingsErrorCode =
	| "invalid-profile"
	| "missing-api-key"
	| "embedding-failed";

/**
 * Generate embeddings for document chunks
 * This function:
 * 1. Creates an embedder from the specified embedding profile
 * 2. Processes chunks in batches to generate embeddings
 * 3. Returns embeddings with their metadata
 *
 * @param options - Embedding generation settings
 * @returns Generated embeddings with metadata
 * @throws Error with code if embedding generation fails
 */
export async function generateEmbeddings(
	options: GenerateEmbeddingsOptions,
): Promise<GenerateEmbeddingsResult> {
	const {
		chunks,
		embeddingProfileId,
		maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
		signal,
		embeddingComplete,
	} = options;

	if (!Number.isInteger(maxBatchSize) || maxBatchSize <= 0) {
		throw Object.assign(
			new Error(
				`maxBatchSize must be a positive integer (received ${maxBatchSize}).`,
			),
			{ code: "embedding-failed" as GenerateEmbeddingsErrorCode },
		);
	}

	signal?.throwIfAborted();

	// Validate embedding profile
	const profile = EMBEDDING_PROFILES[embeddingProfileId];
	if (!profile) {
		throw Object.assign(
			new Error(`Invalid embedding profile ID: ${embeddingProfileId}`),
			{ code: "invalid-profile" as GenerateEmbeddingsErrorCode },
		);
	}

	// Get API key for the provider
	const apiKey =
		process.env[
			profile.provider === "openai"
				? "OPENAI_API_KEY"
				: profile.provider === "google"
					? "GOOGLE_GENERATIVE_AI_API_KEY"
					: "COHERE_API_KEY"
		];

	if (!apiKey) {
		throw Object.assign(
			new Error(`No API key found for embedding profile ${embeddingProfileId}`),
			{ code: "missing-api-key" as GenerateEmbeddingsErrorCode },
		);
	}

	signal?.throwIfAborted();

	// Create embedder
	const embedder: EmbedderFunction = createEmbedderFromProfile(
		embeddingProfileId,
		apiKey,
		{ embeddingComplete },
	);

	// Generate embeddings in batches
	const embeddings: EmbeddingResult[] = [];

	try {
		for (let i = 0; i < chunks.length; i += maxBatchSize) {
			signal?.throwIfAborted();

			const batch = chunks.slice(i, i + maxBatchSize);
			const batchEmbeddings = await embedder.embedMany(batch);

			if (batchEmbeddings.length !== batch.length) {
				throw new Error(
					`Embedder returned ${batchEmbeddings.length} embeddings for ${batch.length} chunks`,
				);
			}

			for (let j = 0; j < batch.length; j++) {
				embeddings.push({
					chunkIndex: i + j,
					content: batch[j],
					embedding: batchEmbeddings[j],
				});
			}
		}
	} catch (error) {
		if (signal?.aborted) {
			throw error;
		}

		throw Object.assign(new Error("Failed to generate embeddings"), {
			code: "embedding-failed" as GenerateEmbeddingsErrorCode,
			cause: error,
		});
	}

	// Validate dimensions
	if (embeddings.length === 0) {
		throw Object.assign(new Error("No embeddings were generated"), {
			code: "embedding-failed" as GenerateEmbeddingsErrorCode,
		});
	}

	const actualDimensions = embeddings[0].embedding.length;
	if (actualDimensions !== profile.dimensions) {
		throw Object.assign(
			new Error(
				`Embedding dimension mismatch: expected ${profile.dimensions}, got ${actualDimensions}`,
			),
			{ code: "embedding-failed" as GenerateEmbeddingsErrorCode },
		);
	}

	return {
		embeddings,
		embeddingCount: embeddings.length,
		dimensions: actualDimensions,
	};
}
