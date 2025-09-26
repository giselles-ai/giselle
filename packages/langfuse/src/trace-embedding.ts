import { calculateEmbeddingDisplayCost } from "@giselle-sdk/language-model";
import type { EmbeddingMetrics } from "@giselle-sdk/rag";
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
		const trace = langfuse.trace({
			name: "embedding",
			input: texts,
			userId: args.userId,
			sessionId: args.sessionId,
			metadata: args.metadata,
			tags: [
				...(args.tags ?? []),
				...buildTags({
					provider,
					dimensions,
					operation,
				}),
			],
		});

		const textTokens = usage?.tokens ?? 0;
		const imageTokens = usage?.imageTokens ?? 0;
		const cost = await calculateEmbeddingDisplayCost(provider, model, {
			tokens: textTokens,
			imageTokens,
		});
		const totalTokens = textTokens + imageTokens;

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
			metadata: args.metadata,
		});

		await langfuse.flushAsync();
	} catch (error) {
		// Log error with context for debugging
		console.error("Telemetry emission failed:", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}
