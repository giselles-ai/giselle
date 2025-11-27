import { createGateway } from "@ai-sdk/gateway";
import type { EmbeddingProfile } from "@giselles-ai/protocol";
import { createAiSdkEmbedder, type EmbedderConfig } from "./ai-sdk-embedder";
import type { EmbedderFunction } from "./types";

const GATEWAY_SUPPORTED_MODELS = new Set<string>([
	"openai/text-embedding-3-small",
	"openai/text-embedding-3-large",
	"google/gemini-embedding-001",
]);

function toGatewayModelId(profile: EmbeddingProfile) {
	return `${profile.provider}/${profile.model}`;
}

export function isGatewaySupportedEmbeddingProfile(
	profile: EmbeddingProfile,
): boolean {
	return GATEWAY_SUPPORTED_MODELS.has(toGatewayModelId(profile));
}

export function createGatewayEmbedder(
	config: EmbedderConfig,
): EmbedderFunction {
	const gateway = createGateway({
		apiKey: config.apiKey,
		headers: config.headers,
	});
	const modelId = toGatewayModelId(config.profile) as Parameters<
		typeof gateway.textEmbeddingModel
	>[0];

	return createAiSdkEmbedder(
		{
			...config,
			transport: config.transport ?? "gateway",
		},
		() => gateway.textEmbeddingModel(modelId),
	);
}
