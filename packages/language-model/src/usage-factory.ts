import type { UsageCalculator } from "./base";
import { OpenAIImageGenerationUsageCalculator } from "./openai-image";

const usageCalculatorMap: Record<string, UsageCalculator> = {
	"gpt-image-1": new OpenAIImageGenerationUsageCalculator(),
};

export function createUsageCalculator(modelId: string): UsageCalculator {
	if (usageCalculatorMap[modelId]) {
		return usageCalculatorMap[modelId];
	}
	throw new Error(`Unknown model: ${modelId}`);
}
