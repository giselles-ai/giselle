import { createOpenAI } from "@ai-sdk/openai";
import { createAiSdkEmbedder, type EmbedderConfig } from "./ai-sdk-embedder";
import type { EmbedderFunction } from "./types";

/**
 * Create an OpenAI embedder with the specified configuration
 * @param config Configuration for the OpenAI embedder
 * @returns An embedder object with embed and embedMany functions
 */
export function createOpenAIEmbedder(config: EmbedderConfig): EmbedderFunction {
	const openai = createOpenAI({ apiKey: config.apiKey });

	return createAiSdkEmbedder(
		{
			...config,
			transport: config.transport ?? "provider",
		},
		(modelName) => openai.embedding(modelName),
	);
}
