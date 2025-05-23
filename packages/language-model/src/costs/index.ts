export * from "./pricing";
export {
	openAiTokenPricing,
	anthropicTokenPricing,
	getValidPricing,
	type ModelPriceTable,
} from "./model-prices";
export type { ModelTokenUsage } from "./usage";
export { calculateTokenCostForDisplay } from "./calculator";
export type { CostCalculator, CostResultForDisplay } from "./calculator";

import { AnthropicCostCalculator } from "../anthropic";
import { GoogleCostCalculator } from "../google";
import { OpenAICostCalculator } from "../openai";
import type { CostCalculator } from "./calculator";
import { DefaultCostCalculator } from "./calculator";

export function createDisplayCostCalculator(provider: string): CostCalculator {
	switch (provider) {
		case "openai":
			return new OpenAICostCalculator();
		case "anthropic":
			return new AnthropicCostCalculator();
		case "google":
			return new GoogleCostCalculator();
		default:
			console.log(`Unimplemented provider: ${provider}`);
			return new DefaultCostCalculator(provider);
	}
}

export async function calculateDisplayCost(
	provider: string,
	modelId: string,
	usage: { promptTokens: number; completionTokens: number },
) {
	const calculator = createDisplayCostCalculator(provider);
	const result = await calculator.calculate(modelId, {
		inputTokens: usage.promptTokens,
		outputTokens: usage.completionTokens,
		totalTokens: usage.promptTokens + usage.completionTokens,
	});
	return {
		inputCostForDisplay: result.input,
		outputCostForDisplay: result.output,
		totalCostForDisplay: result.total,
	};
}
