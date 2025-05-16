import type { BaseTokenPrice, Cost, TokenBasedPricing } from "./pricing";
import { tokensToMegaTokens } from "./pricing";
import type { ModelTokenUsage, ModelUsage } from "./usage";

/**
 * For preliminary feedback on UI and LLM o11y platform
 * Not for billing
 */
export interface CostResultForDisplay {
	input: Cost;
	output: Cost;
	total: Cost;
}

/**
 * Base interface for tool configurations
 * All provider-specific configurations should extend this interface
 * and be defined in their respective provider files.
 */
export interface CostCalculator<TUsage extends ModelUsage = ModelTokenUsage> {
	calculate(model: string, usage: TUsage): Promise<CostResultForDisplay>;
}

export class DefaultCostCalculator implements CostCalculator {
	constructor(private provider: string) {}

	async calculate(
		model: string,
		usage: ModelUsage,
	): Promise<CostResultForDisplay> {
		console.log(`No cost calculator found for ${this.provider}`);
		return { input: 0, output: 0, total: 0 };
	}
}

export function calculateTokenCostForDisplay(
	usage: ModelTokenUsage,
	pricing: TokenBasedPricing,
): CostResultForDisplay {
	// avoid errors related to floating points by:
	// - executing all calculations using integer
	// - converting back to the original unit
	const dollarToCent = 100;
	const tokensPerMegaToken = 1_000_000;

	// Convert dollar per-megatoken to cents per-megatoken
	// Multiply by 100 to convert to cents, then by 1,000,000 to avoid floating point
	const inputCostPerMegaTokenInCents =
		pricing.input.costPerMegaToken * dollarToCent * tokensPerMegaToken;
	const outputCostPerMegaTokenInCents =
		pricing.output.costPerMegaToken * dollarToCent * tokensPerMegaToken;

	// Calculate costs in cents using integer arithmetic
	const inputCostInCents = usage.promptTokens * inputCostPerMegaTokenInCents;
	const outputCostInCents =
		usage.completionTokens * outputCostPerMegaTokenInCents;
	const totalCostInCents = inputCostInCents + outputCostInCents;

	// Convert back to dollars by dividing by 1,000,000 (mega tokens) and 100 (cents)
	const divisor = tokensPerMegaToken * dollarToCent * tokensPerMegaToken;
	return {
		input: inputCostInCents / divisor,
		output: outputCostInCents / divisor,
		total: totalCostInCents / divisor,
	};
}
