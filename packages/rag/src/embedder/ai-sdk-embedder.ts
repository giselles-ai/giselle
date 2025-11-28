import type { EmbeddingProfile } from "@giselles-ai/protocol";
import { type EmbeddingModel, embed, embedMany } from "ai";
import { ConfigurationError, EmbeddingError } from "../errors";
import type {
	EmbedderFunction,
	EmbeddingCompleteCallback,
	EmbeddingOptions,
} from "./types";

export interface EmbedderConfig {
	apiKey: string;
	profile: EmbeddingProfile;
	maxRetries?: number;
	embeddingComplete?: EmbeddingCompleteCallback;
	transport?: "gateway" | "provider";
	headers?: Record<string, string>;
}

export function createAiSdkEmbedder(
	config: EmbedderConfig,
	getModel: (modelName: string) => EmbeddingModel<string>,
): EmbedderFunction {
	if (!config.apiKey || config.apiKey.length === 0) {
		throw ConfigurationError.missingField("apiKey");
	}

	const { model, provider, dimensions } = config.profile;
	const maxRetries = config.maxRetries ?? 3;
	const transport = config.transport ?? "provider";
	const normalizeUsage = (
		rawUsage: unknown,
	): { tokens: number; imageTokens?: number } | undefined => {
		if (!rawUsage || typeof rawUsage !== "object") {
			return undefined;
		}
		const usageWithNumbers = rawUsage as {
			tokens?: unknown;
			imageTokens?: unknown;
		};
		const hasTokens = typeof usageWithNumbers.tokens === "number";
		const tokens = hasTokens ? (usageWithNumbers.tokens as number) : 0;
		const normalized: { tokens: number; imageTokens?: number } = { tokens };
		const hasImageTokens = typeof usageWithNumbers.imageTokens === "number";
		if (hasImageTokens) {
			normalized.imageTokens = usageWithNumbers.imageTokens as number;
		}
		if (!hasTokens && !hasImageTokens) {
			return undefined;
		}
		return normalized;
	};

	return {
		async embed(text: string, options?: EmbeddingOptions): Promise<number[]> {
			try {
				const startTime = new Date();
				const result = await embed({
					model: getModel(model),
					maxRetries,
					value: text,
					headers: options?.headers,
				});

				if (config.embeddingComplete) {
					try {
						const usage = normalizeUsage(result.usage);
						await config.embeddingComplete({
							texts: [text],
							embeddings: [result.embedding],
							model,
							provider,
							dimensions,
							usage,
							operation: "embed",
							startTime,
							endTime: new Date(),
							transport,
							providerMetadata: result.providerMetadata,
						});
					} catch (error) {
						console.error("Embedding callback error:", error);
					}
				}

				return result.embedding;
			} catch (error: unknown) {
				throw EmbeddingError.apiError(
					error instanceof Error ? error : new Error(String(error)),
					{ operation: "embed", model },
				);
			}
		},

		async embedMany(
			texts: string[],
			options?: EmbeddingOptions,
		): Promise<number[][]> {
			try {
				const startTime = new Date();
				const result = await embedMany({
					model: getModel(model),
					maxRetries,
					values: texts,
					headers: options?.headers,
				});

				if (config.embeddingComplete) {
					try {
						const usage = normalizeUsage(result.usage);
						await config.embeddingComplete({
							texts,
							embeddings: result.embeddings,
							model,
							provider,
							dimensions,
							usage,
							operation: "embedMany",
							startTime,
							endTime: new Date(),
							transport,
							providerMetadata: result.providerMetadata,
						});
					} catch (error) {
						console.error("Embedding callback error:", error);
					}
				}

				return result.embeddings;
			} catch (error: unknown) {
				throw EmbeddingError.apiError(
					error instanceof Error ? error : new Error(String(error)),
					{ operation: "embedMany", model },
				);
			}
		},
		embeddingComplete: config.embeddingComplete,
	};
}
