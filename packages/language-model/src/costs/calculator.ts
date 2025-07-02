import type { ModelPriceTable } from "./model-prices";
import { getValidPricing } from "./model-prices";
import type { Cost, TokenBasedPricing } from "./pricing";
import type { ModelTokenUsage } from "./usage";

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
export interface CostCalculator {
	calculate(
		model: string,
		usage: ModelTokenUsage,
	): Promise<CostResultForDisplay> | CostResultForDisplay;
}

export abstract class BaseCostCalculator implements CostCalculator {
	protected abstract getPricingTable(): ModelPriceTable;

	protected getProviderName(): string {
		return this.constructor.name.replace("CostCalculator", "");
	}

	calculate(modelId: string, usage: ModelTokenUsage) {
		try {
			const validPrice = getValidPricing(modelId, this.getPricingTable());
			return calculateTokenCostForDisplay(usage, validPrice.price);
		} catch (error) {
			console.error(
				`Error calculating cost for ${this.getProviderName()} model ${modelId}:`,
				error,
			);
			return {
				input: 0,
				output: 0,
				total: 0,
			};
		}
	}
}

export class DefaultCostCalculator implements CostCalculator {
	constructor(private readonly provider: string) {}

	calculate(modelId: string, _usage: ModelTokenUsage): CostResultForDisplay {
		console.log(
			`Cost calculation not implemented for provider: ${this.provider}, model: ${modelId}`,
		);
		return {
			input: 0,
			output: 0,
			total: 0,
		};
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
	const inputCostInCents = usage.inputTokens * inputCostPerMegaTokenInCents;
	const outputCostInCents = usage.outputTokens * outputCostPerMegaTokenInCents;
	const totalCostInCents = inputCostInCents + outputCostInCents;

	// Convert back to dollars by dividing by 1,000,000 (mega tokens) and 100 (cents)
	const divisor = tokensPerMegaToken * dollarToCent * tokensPerMegaToken;
	return {
		input: inputCostInCents / divisor,
		output: outputCostInCents / divisor,
		total: totalCostInCents / divisor,
	};
}
