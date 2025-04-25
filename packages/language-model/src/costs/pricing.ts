// Model cost in USD
export type Cost = number;

/**
 * Base configuration for token-based pricing (flat rate)
 * Represents the simplest form of token pricing with a fixed cost per token
 */
export type BaseTokenPrice = {
	type: "token";
	costPerMegaToken: Cost;
};

/**
 * Token-based pricing with tiered rates
 * - Inclusive (<=): Base price for tokens <= threshold, different price for tokens > threshold
 * - Exclusive (<): Base price for tokens < threshold, different price for tokens >= threshold
 */
export type TieredTokenPrice = BaseTokenPrice & {
	threshold: number;
	costPerMegaTokenAboveThreshold: Cost;
	thresholdType: "<=" | "<";
};

/**
 * Token-based pricing configuration
 * Can be either a flat rate (BaseTokenPrice) or a tiered rate (TieredTokenPrice)
 */
export type TokenBasedPrice = BaseTokenPrice | TieredTokenPrice;

/**
 * Token-based pricing with input/output configuration
 */
export type TokenBasedPricing = {
	type: "token";
	input: TokenBasedPrice;
	output: TokenBasedPrice;
};

/**
 * Image pricing based on count
 */
export type ImageCountBasedPrice = {
	type: "image";
	pricingType: "per_image";
	costPerImage: Cost;
};

/**
 * Image pricing based on size
 */
export type ImageSizeBasedPrice = {
	type: "image";
	pricingType: "per_megapixel";
	costPerMegaPixel: Cost;
};

/**
 * Web search pricing configuration
 */
export type WebSearchPrice = {
	type: "web_search";
	costPerKiloCalls: Record<SearchContextSize, Cost>;
};

/**
 * Search context size options for web search API
 */
export type SearchContextSize = "low" | "medium" | "high";

/**
 * Model pricing configuration for a specific time period
 */
export type ModelPrice = {
	validFrom: string;
	price: TokenBasedPricing | WebSearchPrice;
};

/**
 * Model pricing configuration with multiple price points
 */
export type ModelPriceConfig = {
	prices: ModelPrice[];
};
