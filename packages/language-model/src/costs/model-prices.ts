import { type ModelPriceConfig } from "./types";

/**
 * Model pricing configurations
 *
 * Note: This file only manages pricing for models with tier-based or special pricing.
 *   Models with flat-rate pricing (e.g., OpenAI and Anthropic) are not included here
 *   because they can easily be obtained from Langfuse.
 */
export const modelPrices: Record<string, ModelPriceConfig> = {
  "gemini-1.5-pro": {
    prices: [
      {
        validFrom: "2025-04-23T00:00:00Z",
        input: {
          type: "token",
          costPerToken: 1.25,
          thresholdType: "<=",
          threshold: 128_000,
          costPerTokenAboveThreshold: 2.50,
        },
        output: {
          type: "token",
          costPerToken: 5.00,
          thresholdType: "<=",
          threshold: 128_000,
          costPerTokenAboveThreshold: 10.00,
        },
      },
    ],
  },
};
