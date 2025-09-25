import {
	EMBEDDING_PROFILES,
	type EmbeddingProfileId,
} from "@giselle-sdk/data-type";
import { ConfigurationError } from "../errors";
import type { EmbedderConfig } from "./ai-sdk-embedder";
import { createCohereEmbedder } from "./cohere";
import { createGoogleEmbedder } from "./google";
import { createOpenAIEmbedder } from "./openai";
import type { EmbedderFunction } from "./types";

export function createEmbedderFromProfile(
	profileId: EmbeddingProfileId,
	apiKey: string,
	options?: Pick<EmbedderConfig, "maxRetries" | "embeddingComplete">,
): EmbedderFunction {
	const profile = EMBEDDING_PROFILES[profileId];
	if (!profile) {
		throw ConfigurationError.invalidValue(
			"profileId",
			profileId,
			`one of: ${Object.keys(EMBEDDING_PROFILES).join(", ")}`,
		);
	}

	switch (profile.provider) {
		case "openai":
			return createOpenAIEmbedder({
				apiKey,
				profile,
				...options,
			});
		case "google":
			return createGoogleEmbedder({
				apiKey,
				profile,
				...options,
			});
		case "cohere":
			return createCohereEmbedder({
				apiKey,
				profile,
				...options,
			});
		default: {
			const _exhaustiveCheck: never = profile;
			throw new Error(`Unknown provider: ${_exhaustiveCheck}`);
		}
	}
}
