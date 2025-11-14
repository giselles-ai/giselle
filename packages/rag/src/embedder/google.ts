import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAiSdkEmbedder, type EmbedderConfig } from "./ai-sdk-embedder";
import type { EmbedderFunction } from "./types";

/**
 * Create a Google embedder with the specified configuration
 * @param config Configuration for the Google embedder
 * @returns An embedder object with embed and embedMany functions
 */
export function createGoogleEmbedder(config: EmbedderConfig): EmbedderFunction {
	const google = createGoogleGenerativeAI({ apiKey: config.apiKey });

	return createAiSdkEmbedder(
		{
			...config,
			transport: config.transport ?? "provider",
		},
		(modelName) => google.textEmbeddingModel(modelName),
	);
}
