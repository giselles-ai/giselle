import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { EmbeddingError } from "../errors";
import type { EmbedderFunction } from "./types";

export type OpenAIEmbeddingModel =
	| "text-embedding-3-small"
	| "text-embedding-3-large"
	| "text-embedding-ada-002";

export interface OpenAIEmbedderConfig {
	apiKey: string;
	model?: OpenAIEmbeddingModel;
	maxRetries?: number;
}

/**
 * Create an OpenAI embedder with the specified configuration
 * @param config Configuration for the OpenAI embedder
 * @returns An embedder object with embed and embedMany functions
 */
export function createOpenAIEmbedder(
	config: OpenAIEmbedderConfig,
): EmbedderFunction {
	if (!config.apiKey || config.apiKey.length === 0) {
		throw new Error("API key is required and cannot be empty");
	}

	const model = config.model ?? "text-embedding-3-small";
	const maxRetries = config.maxRetries ?? 3;

	if (config.maxRetries !== undefined && (maxRetries < 0 || maxRetries > 10)) {
		throw new Error("maxRetries must be between 0 and 10");
	}

	return {
		async embed(text: string): Promise<number[]> {
			try {
				const { embedding } = await embed({
					model: openai.embedding(model),
					maxRetries,
					value: text,
				});
				return embedding;
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw EmbeddingError.apiError(error, {
						operation: "embed",
						model,
					});
				}
				throw EmbeddingError.apiError(new Error(String(error)), {
					operation: "embed",
					model,
				});
			}
		},

		async embedMany(texts: string[]): Promise<number[][]> {
			try {
				const { embeddings } = await embedMany({
					model: openai.embedding(model),
					maxRetries,
					values: texts,
				});
				return embeddings;
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw EmbeddingError.apiError(error, {
						operation: "embedMany",
						model,
					});
				}
				throw EmbeddingError.apiError(new Error(String(error)), {
					operation: "embedMany",
					model,
				});
			}
		},
	};
}
