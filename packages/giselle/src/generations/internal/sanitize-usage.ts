import type { GenerationUsage } from "@giselles-ai/protocol";

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

/**
 * Normalizes usage metrics so they can be safely persisted.
 *
 * The AI SDK surfaces token usage fields as `number | undefined` and internally
 * uses `NaN` only as a temporary fallback when the provider omits usage
 * information. JSON (and therefore our storage layer) cannot serialize `NaN`,
 * and relational aggregates expect finite numbers. Converting any non-finite
 * value to `undefined` preserves the SDK contrtask while keeping our
 * persistence and analytics layers consistent.
 */
export function sanitizeGenerationUsage(
	usage?: GenerationUsage,
): GenerationUsage | undefined {
	if (usage === undefined) {
		return undefined;
	}

	const sanitized: GenerationUsage = {
		inputTokens: isFiniteNumber(usage.inputTokens)
			? usage.inputTokens
			: undefined,
		outputTokens: isFiniteNumber(usage.outputTokens)
			? usage.outputTokens
			: undefined,
		totalTokens: isFiniteNumber(usage.totalTokens)
			? usage.totalTokens
			: undefined,
		reasoningTokens: isFiniteNumber(usage.reasoningTokens)
			? usage.reasoningTokens
			: undefined,
		cachedInputTokens: isFiniteNumber(usage.cachedInputTokens)
			? usage.cachedInputTokens
			: undefined,
	};

	if (
		sanitized.inputTokens === undefined &&
		sanitized.outputTokens === undefined &&
		sanitized.totalTokens === undefined &&
		sanitized.reasoningTokens === undefined &&
		sanitized.cachedInputTokens === undefined
	) {
		return undefined;
	}

	return sanitized;
}
