export * from "./pricing";
export {
	openAiTokenPricing,
	getValidPricing,
	type ModelPriceTable,
} from "./model-prices";
export type { ModelTokenUsage } from "./usage";
export { calculateTokenCostForDisplay } from "./calculator";
export type { CostCalculator, CostResultForDisplay } from "./calculator";

import { OpenAICostCalculator } from "../openai";
import type { CostCalculator } from "./calculator";
import { DefaultCostCalculator } from "./calculator";

export function createDisplayCostCalculator(provider: string): CostCalculator {
	switch (provider) {
		case "openai":
			return new OpenAICostCalculator();
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
		...usage,
		totalTokens: usage.promptTokens + usage.completionTokens,
	});
	return {
		inputCostForDisplay: result.input,
		outputCostForDisplay: result.output,
		totalCostForDisplay: result.total,
	};
}
