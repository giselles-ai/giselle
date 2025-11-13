export type { EmbedderConfig } from "./ai-sdk-embedder";
export {
	createGatewayEmbedder,
	isGatewaySupportedEmbeddingProfile,
} from "./gateway";
export { createGoogleEmbedder } from "./google";
export { createOpenAIEmbedder } from "./openai";
export {
	type CreateEmbedderFromProfileOptions,
	createEmbedderFromProfile,
} from "./profiles";
export type {
	EmbedderFunction,
	EmbeddingCompleteCallback,
	EmbeddingMetrics,
} from "./types";
