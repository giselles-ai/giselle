import type { TokenBasedPricing, WebSearchApiCallBasedPrice } from "./pricing";

/**
 * Model pricing configurations
 *
 * Note: This file only manages pricing for models with tier-based or special pricing.
 *   Models with flat-rate pricing (e.g., OpenAI and Anthropic) are not included here
 *   because they can easily be obtained from Langfuse.
 */

/**
 * Shared pricing configurations for model groups
 */
export const webSearchPricing = {
  gpt4: {
    validFrom: "2025-04-23T00:00:00Z",
    price: {
      type: "usage" as const,
      price: {
        type: "web_search" as const,
        costPerKCalls: {
          low: 30.00,
          medium: 35.00,
          high: 50.00,
        },
      } satisfies WebSearchApiCallBasedPrice,
    },
  },
  gpt4Mini: {
    validFrom: "2025-04-23T00:00:00Z",
    price: {
      type: "usage" as const,
      price: {
        type: "web_search" as const,
        costPerKCalls: {
          low: 25.00,
          medium: 27.50,
          high: 30.00,
        },
      } satisfies WebSearchApiCallBasedPrice,
    },
  },
};

/**
 * Model ID groups sharing the same pricing
 */
const modelGroups = {
  gpt4: ["gpt-4o", "gpt-4.1", "gpt-4o-search-preview"],
  gpt4Mini: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o-mini-search-preview"],
} as const;

const generateModelPrices = () => {
  const prices: Record<string, ModelPriceConfig> = {};

  // GPT-4 models
  modelGroups.gpt4.forEach(modelId => {
    prices[modelId] = {
      prices: [webSearchPricing.gpt4],
    };
  });

  // GPT-4 Mini models
  modelGroups.gpt4Mini.forEach(modelId => {
    prices[modelId] = {
      prices: [webSearchPricing.gpt4Mini],
    };
  });

  // Other models with unique pricing
  return {
    ...prices,
    "gemini-1.5-pro": {
      prices: [
        {
          validFrom: "2025-04-23T00:00:00Z",
          price: {
            type: "token" as const,
            input: {
              type: "token" as const,
              costPerMegaToken: 1.25,
              threshold: 128_000,
              costPerMegaTokenAboveThreshold: 2.50,
              thresholdType: "<=" as const,
            },
            output: {
              type: "token" as const,
              costPerMegaToken: 5.00,
              threshold: 128_000,
              costPerMegaTokenAboveThreshold: 10.00,
              thresholdType: "<=" as const,
            },
          },
        },
      ],
    },
  };
};

export getModelPriceFromLangfuse(model: string): TokenBasedPricing {
        // TODO: get from internet
        const response = {
                id: model,
                modelName: model,
                matchPattern: model,
                startDate: null,
                unit: "CHARACTERS",
                inputPrice: 0.0123,
                outputPrice: 0.0456,
                totalPrice: null,
                tokenizerId: null,
                tokenizerConfig: null,
                isLangfuseManaged: true
        };

        return {
                type: "token",
                input: response.inputPrice ?? 0,
                output: response.outputPrice ?? 0,
                },
        };

export const modelPrices = generateModelPrices();
