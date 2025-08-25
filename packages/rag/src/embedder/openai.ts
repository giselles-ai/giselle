import { createOpenAI } from "@ai-sdk/openai";
import type { OpenAIEmbeddingModel } from "@giselle-sdk/data-type";
import {
	type BaseEmbedderConfig,
	createAiSdkEmbedder,
} from "./ai-sdk-embedder";
import type { EmbedderFunction } from "./types";

export type OpenAIEmbedderConfig = BaseEmbedderConfig & {
	model?: OpenAIEmbeddingModel;
};

/**
 * Create an OpenAI embedder with the specified configuration
 * @param config Configuration for the OpenAI embedder
 * @returns An embedder object with embed and embedMany functions
 */
export function createOpenAIEmbedder(
	config: OpenAIEmbedderConfig,
): EmbedderFunction {
	const openai = createOpenAI({ apiKey: config.apiKey });
	const defaultModel: OpenAIEmbeddingModel = "text-embedding-3-small";
	return createAiSdkEmbedder(config, defaultModel, (modelName) =>
		openai.embedding(modelName),
	);
}
