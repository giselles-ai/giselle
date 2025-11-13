import {
	EMBEDDING_PROFILES,
	type EmbeddingProfileId,
} from "@giselles-ai/protocol";
import { ConfigurationError } from "../errors";
import type { EmbedderConfig } from "./ai-sdk-embedder";
import {
	createGatewayEmbedder,
	isGatewaySupportedEmbeddingProfile,
} from "./gateway";
import { createGoogleEmbedder } from "./google";
import { createNotImplementedEmbedder } from "./not-implemented";
import { createOpenAIEmbedder } from "./openai";
import type { EmbedderFunction } from "./types";

export type CreateEmbedderFromProfileOptions = Pick<
	EmbedderConfig,
	"maxRetries" | "embeddingComplete"
> & {
	transport?: "gateway" | "provider";
};

export function createEmbedderFromProfile(
	profileId: EmbeddingProfileId,
	apiKey: string,
	options?: CreateEmbedderFromProfileOptions,
): EmbedderFunction {
	const profile = EMBEDDING_PROFILES[profileId];
	if (!profile) {
		throw ConfigurationError.invalidValue(
			"profileId",
			profileId,
			`one of: ${Object.keys(EMBEDDING_PROFILES).join(", ")}`,
		);
	}

	const { transport = "provider", ...embedderOptions } = options ?? {};

	if (transport === "gateway") {
		if (!isGatewaySupportedEmbeddingProfile(profile)) {
			throw new ConfigurationError(
				`Embedding profile '${profileId}' (${profile.provider}/${profile.model}) is not supported by AI Gateway`,
			);
		}

		return createGatewayEmbedder({
			apiKey,
			profile,
			...embedderOptions,
		});
	}

	switch (profile.provider) {
		case "openai":
			return createOpenAIEmbedder({
				apiKey,
				profile,
				...embedderOptions,
			});
		case "google":
			return createGoogleEmbedder({
				apiKey,
				profile,
				...embedderOptions,
			});
		case "cohere":
			// Placeholder: actual Cohere embedder will be added in a follow-up PR
			return createNotImplementedEmbedder("cohere");
		default: {
			const _exhaustiveCheck: never = profile;
			throw new Error(`Unknown provider: ${_exhaustiveCheck}`);
		}
	}
}
