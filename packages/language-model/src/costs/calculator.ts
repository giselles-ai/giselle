import { type Cost, type SearchContextSize, type TokenBasedPrice, type TokenBasedPricing, type WebSearchApiCallBasedPrice } from "./types";

export type ModelCostInfo = {
  inputCostPerThousandTokens: number;
  outputCostPerThousandTokens: number;
};

export type TokenUsage = {
  type: "token";
  inputTokens: number;
  outputTokens: number;
};

export type ImageCountUsage = {
  type: "image_count";
  images: number;
};

export type ImageSizeUsage = {
  type: "image_size";
  megaPixels: number;
};

export type ImageUsage = ImageCountUsage | ImageSizeUsage;

export type WebSearchUsage = {
  type: "web_search";
  calls: number;
  contextSize: SearchContextSize;
};

export type ModelUsage =
  | ({ type: "token"; } & TokenUsage)
  | ImageUsage
  | WebSearchUsage;

export type CostResult = {
  input: Cost;
  output: Cost;
  total: Cost;
};

/**
 * Interface for cost calculation
 */
export interface CostCalculator<Usage extends ModelUsage, Pricing> {
  calculate(usage: Usage, pricing: Pricing): CostResult;
}

/**
 * Interface for token-based cost calculation
 */
export interface TokenCostCalculator extends CostCalculator<TokenUsage, TokenBasedPricing> {}

/**
 * Interface for web search cost calculation
 */
export interface WebSearchCostCalculator extends CostCalculator<WebSearchUsage, WebSearchApiCallBasedPrice> {}
