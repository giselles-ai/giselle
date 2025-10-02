import type { GenerationUsage } from "../../../concepts/generation";

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

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
