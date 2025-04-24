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
					low: 30.0,
					medium: 35.0,
					high: 50.0,
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
					low: 25.0,
					medium: 27.5,
					high: 30.0,
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
	modelGroups.gpt4.forEach((modelId) => {
		prices[modelId] = {
			prices: [webSearchPricing.gpt4],
		};
	});

	// GPT-4 Mini models
	modelGroups.gpt4Mini.forEach((modelId) => {
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
							costPerMegaTokenAboveThreshold: 2.5,
							thresholdType: "<=" as const,
						},
						output: {
							type: "token" as const,
							costPerMegaToken: 5.0,
							threshold: 128_000,
							costPerMegaTokenAboveThreshold: 10.0,
							thresholdType: "<=" as const,
						},
					},
				},
			],
		},
	};
};

interface LangfuseModelPrice {
	id: string;
	modelName: string;
	matchPattern: string;
	startDate: null;
	unit: "CHARACTERS";
	inputPrice: number | null;
	outputPrice: number | null;
	totalPrice: number | null;
	tokenizerId: string | null;
	tokenizerConfig: unknown | null;
	isLangfuseManaged: boolean;
}

export function getModelPriceFromLangfuse(model: string): TokenBasedPricing {
	// TODO: get from internet
	const response: LangfuseModelPrice = {
		id: model,
		modelName: model,
		matchPattern: model,
		startDate: null,
		unit: "CHARACTERS",
		inputPrice: model.includes("gpt-4") ? 0.03 : 0.0005,
		outputPrice: model.includes("gpt-4") ? 0.06 : 0.0015,
		totalPrice: null,
		tokenizerId: "cl100k_base",
		tokenizerConfig: null,
		isLangfuseManaged: true,
	};

	return {
		type: "token",
		input: {
			type: "token",
			costPerMegaToken: response.inputPrice ?? 0,
		},
		output: {
			type: "token",
			costPerMegaToken: response.outputPrice ?? 0,
		},
	};
}

export const modelPrices = generateModelPrices();
