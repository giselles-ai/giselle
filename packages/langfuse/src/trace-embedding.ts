import { calculateEmbeddingDisplayCost } from "@giselles-ai/language-model";
import type { EmbeddingMetrics } from "@giselles-ai/rag";
import { Langfuse } from "langfuse";

function buildTags(args: {
	provider: "openai" | "google" | "cohere";
	dimensions: number;
	operation: "embed" | "embedMany";
}) {
	return [
		`provider:${args.provider}`,
		`embedding-dimensions:${args.dimensions}`,
		`embedding-operation:${args.operation}`,
	];
}

export async function traceEmbedding(args: {
	metrics: EmbeddingMetrics;
	userId?: string;
	sessionId?: string;
	tags?: string[];
	metadata?: Record<string, unknown>;
}) {
	const {
		texts,
		model,
		operation,
		startTime,
		endTime,
		usage,
		provider,
		dimensions,
	} = args.metrics;

	try {
		const langfuse = new Langfuse();
		const embeddingTransport = args.metrics.transport;
		const metadata = {
			...(args.metadata ?? {}),
			...(embeddingTransport
				? {
						embeddingTransport,
					}
				: {}),
			...(args.metrics.providerMetadata
				? { providerMetadata: args.metrics.providerMetadata }
				: {}),
		};
		const tags = [
			...(args.tags ?? []),
			...buildTags({
				provider,
				dimensions,
				operation,
			}),
			...(embeddingTransport
				? [`embedding-transport:${embeddingTransport}`]
				: []),
		];
		const trace = langfuse.trace({
			name: "embedding",
			input: texts,
			userId: args.userId,
			sessionId: args.sessionId,
			metadata,
			tags,
		});

		const textTokens = usage?.tokens ?? 0;
		const imageTokens = usage?.imageTokens ?? 0;
		const cost = await calculateEmbeddingDisplayCost(provider, model, {
			tokens: textTokens,
			imageTokens,
		});
		const totalTokens = textTokens + imageTokens;

		trace.update({
			metadata,
			tags,
		});

		trace.generation({
			name: operation,
			model: model,
			// don't need to store raw embeddings
			// output: args.metrics.embeddings,
			usage: {
				unit: "TOKENS",
				totalTokens,
				totalCost: cost.totalCostForDisplay,
			},
			startTime: startTime,
			endTime: endTime,
			metadata,
		});

		await langfuse.flushAsync();
	} catch (error) {
		// Log error with context for debugging
		console.error("Telemetry emission failed:", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}
