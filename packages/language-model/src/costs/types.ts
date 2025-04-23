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

export type ImageCountBasedPrice = {
  type: "image";
  pricingType: "per_image";
  costPerImage: Cost;
};

export type ImageSizeBasedPrice = {
  type: "image";
  pricingType: "per_megapixel";
  costPerMegaPixel: Cost;
};

export type FlatApiCallBasedPrice = {
  type: "api_call";
  costPerCall: Cost;
};

/**
 * Search context size options for web search API
 */
export type SearchContextSize = "low" | "medium" | "high";

/**
 * API call-based pricing with context size variations
 */
export type WebSearchApiCallBasedPrice = {
  type: "web_search";
  costPerKCalls: Record<SearchContextSize, Cost>;
};

export type ApiCallBasedPrice = WebSearchApiCallBasedPrice | FlatApiCallBasedPrice;

/**
 * Usage-based (non-token-based) pricing patterns
 */
export type UsageBasedPrice =
  | TokenBasedPrice
  | ImageCountBasedPrice
  | ImageSizeBasedPrice
  | ApiCallBasedPrice;

/**
 * Usage-based pricing configuration
 */
export type UsageBasedPricing = {
  type: "usage";
  price: WebSearchApiCallBasedPrice;
}

/**
 * Model pricing configuration for a specific time period
 * The validity period starts from validFrom and continues until the validFrom of the next price in the array
 * For the latest price (last in the array), it remains valid until a new price is added
 */
export type ModelPrice = {
  validFrom: string;
  price: TokenBasedPricing | UsageBasedPricing;
};

/**
 * Historical pricing configuration for a model
 * Prices should be ordered by validFrom in ascending order
 */
export type ModelPriceConfig = {
  prices: ModelPrice[];
};
