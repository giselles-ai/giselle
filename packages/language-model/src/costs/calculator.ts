import type { Cost } from "./pricing";
import type { TokenBasedPrice, TokenBasedPricing, WebSearchApiCallBasedPrice } from "./pricing";
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

/**
 * Calculate token cost based on pricing configuration
 * Handles both flat rate and tiered pricing
 */
export function calculateTokenCost(tokens: number, pricing: TokenBasedPrice): Cost {
  // Flat rate
  if (!("threshold" in pricing)) {
    return (tokens * pricing.costPerMegaToken) / 1_000_000;
  }

  // Tiered rate
  let baseTokens: number;
  let extraTokens: number;

  if (pricing.thresholdType === "<=") {
    // Inclusive threshold
    baseTokens = Math.min(tokens, pricing.threshold);
    extraTokens = Math.max(0, tokens - pricing.threshold);
  } else {
    // Exclusive threshold
    baseTokens = Math.min(tokens, pricing.threshold - 1);
    extraTokens = Math.max(0, tokens - pricing.threshold + 1);
  }

  return (
    (baseTokens * pricing.costPerMegaToken) +
    (extraTokens * pricing.costPerMegaTokenAboveThreshold)
  ) / 1_000_000;
}
