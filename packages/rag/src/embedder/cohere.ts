import { createCohere } from "@ai-sdk/cohere";
import { createAiSdkEmbedder, type EmbedderConfig } from "./ai-sdk-embedder";
import type { EmbedderFunction } from "./types";

export function createCohereEmbedder(config: EmbedderConfig): EmbedderFunction {
	const cohere = createCohere({ apiKey: config.apiKey });
	return createAiSdkEmbedder(config, (modelName) =>
		cohere.embedding(modelName),
	);
}
