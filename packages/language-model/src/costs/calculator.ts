import type { Cost } from "./pricing";
import type { TokenBasedPricing, WebSearchApiCallBasedPrice } from "./pricing";
import type { ModelUsage, TokenUsage, WebSearchUsage } from "./usage";

export type CostResult = {
  input: Cost;
  output: Cost;
  total: Cost;
};

export interface CostCalculator<Usage extends ModelUsage, Pricing> {
  calculate(usage: Usage, pricing: Pricing): CostResult;
}

export interface TokenCostCalculator extends CostCalculator<TokenUsage, TokenBasedPricing> {}

export interface WebSearchCostCalculator extends CostCalculator<WebSearchUsage, WebSearchApiCallBasedPrice> {}
