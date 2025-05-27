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

export type ModelPriceId = string;

export type ModelPriceInput = {
	validFrom: string;
	price: TokenBasedPricing;
};

export type ModelPrice = ModelPriceInput & {
	id: ModelPriceId;
};

/**
 * Creates a price table for a model
 */
export function defineModelPriceTable<T extends string>(
	entries: Record<T, ModelPriceInput[]>,
): Record<T, { prices: ModelPrice[] }> {
	return Object.fromEntries(
		Object.entries<ModelPriceInput[]>(entries).map(([model, prices]) => [
			model,
			{
				prices: prices.map((price) => ({
					...price,
					id: `${model}-${price.validFrom}`,
				})),
			},
		]),
	) as Record<T, { prices: ModelPrice[] }>;
}

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
