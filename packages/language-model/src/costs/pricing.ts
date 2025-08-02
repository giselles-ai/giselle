// Model cost in USD
export type Cost = number;

export function tokensToMegaTokens(tokens: number): number {
	return tokens / 1_000_000;
}

/**
 * Base configuration for token-based pricing (flat rate)
 * Represents the simplest form of token pricing with a fixed cost per token
 */
export type BaseTokenPrice = {
	costPerMegaToken: Cost;
};

export type TokenBasedPricing = {
	input: BaseTokenPrice;
	output: BaseTokenPrice;
};

export type ModelPrice = {
	validFrom: string;
	price: TokenBasedPricing;
};

export interface TokenUsage {
	input: number;
	output: number;
}

export interface CostCalculator {
	calculateCost(
		modelId: string,
		usage: TokenUsage,
	): {
		inputCost: Cost;
		outputCost: Cost;
		totalCost: Cost;
	} | null;
}
