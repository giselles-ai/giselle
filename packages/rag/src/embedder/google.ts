import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { GeminiEmbeddingModel } from "@giselle-sdk/data-type";
import {
	type BaseEmbedderConfig,
	createAiSdkEmbedder,
} from "./ai-sdk-embedder";
import type { EmbedderFunction } from "./types";

export type GoogleEmbedderConfig = BaseEmbedderConfig & {
	model?: GeminiEmbeddingModel;
};

/**
 * Create a Google embedder with the specified configuration
 * @param config Configuration for the Google embedder
 * @returns An embedder object with embed and embedMany functions
 */
export function createGoogleEmbedder(
	config: GoogleEmbedderConfig,
): EmbedderFunction {
	const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
	const defaultModel: GeminiEmbeddingModel = "gemini-embedding-001";
	return createAiSdkEmbedder(config, defaultModel, (modelName) =>
		google.textEmbeddingModel(modelName),
	);
}
