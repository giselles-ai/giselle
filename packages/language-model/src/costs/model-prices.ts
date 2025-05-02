import type {
	Cost,
	ModelPrice,
	ModelPriceConfig,
	TokenBasedPricing,
	WebSearchPrice,
} from "./pricing";

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
export const webSearchPricing: Record<string, ModelPriceConfig> = {
	gpt4: {
		prices: [
			{
				validFrom: "2025-04-23T00:00:00Z",
				price: {
					type: "web_search" as const,
					costPerKiloCalls: {
						low: 30.0,
						medium: 35.0,
						high: 50.0,
					},
				} satisfies WebSearchPrice,
			} satisfies ModelPrice,
		],
	} satisfies ModelPriceConfig,
	gpt4Mini: {
		prices: [
			{
				validFrom: "2025-04-23T00:00:00Z",
				price: {
					type: "web_search" as const,
					costPerKiloCalls: {
						low: 25.0,
						medium: 27.5,
						high: 30.0,
					},
				} satisfies WebSearchPrice,
			} satisfies ModelPrice,
		],
	} satisfies ModelPriceConfig,
};

/**
 * Perplexity
 */
export const perplexityTokenPrices: Record<string, ModelPriceConfig> = {
	"sonar-pro": {
		prices: [
			{
				validFrom: "2024-01-01T00:00:00Z",
				price: {
					type: "token" as const,
					input: {
						type: "token" as const,
						costPerMegaToken: 3.0,
					},
					output: {
						type: "token" as const,
						costPerMegaToken: 15.0,
					},
				} satisfies TokenBasedPricing,
			} satisfies ModelPrice,
		],
	} satisfies ModelPriceConfig,
	sonar: {
		prices: [
			{
				validFrom: "2024-01-01T00:00:00Z",
				price: {
					type: "token" as const,
					input: {
						type: "token" as const,
						costPerMegaToken: 1.0,
					},
					output: {
						type: "token" as const,
						costPerMegaToken: 1.0,
					},
				} satisfies TokenBasedPricing,
			} satisfies ModelPrice,
		],
	} satisfies ModelPriceConfig,
};

export const perplexityRequestPrices: Record<string, ModelPriceConfig> = {
	"sonar-pro": {
		prices: [
			{
				validFrom: "2024-01-01T00:00:00Z",
				price: {
					type: "web_search" as const,
					costPerKiloCalls: {
						high: 14.0,
						medium: 10.0,
						low: 6.0,
					},
				} satisfies WebSearchPrice,
			} satisfies ModelPrice,
		],
	} satisfies ModelPriceConfig,
	sonar: {
		prices: [
			{
				validFrom: "2024-01-01T00:00:00Z",
				price: {
					type: "web_search" as const,
					costPerKiloCalls: {
						high: 12.0,
						medium: 8.0,
						low: 5.0,
					},
				} satisfies WebSearchPrice,
			} satisfies ModelPrice,
		],
	} satisfies ModelPriceConfig,
};

type FalImageSizeBasedPrice = {
	type: "size";
	pricePerMegaPixel: number;
};

type FalImageCountBasedPrice = {
	type: "count";
	pricePerImage: number;
};

type FalModelPrice = {
	validFrom: string;
	price: FalImageSizeBasedPrice | FalImageCountBasedPrice;
};

export const falModelPrices = {
	"fal-ai/flux/schnell": {
		prices: [
			{
				validFrom: "2024-01-01T00:00:00Z",
				price: {
					type: "size",
					pricePerMegaPixel: 0.033,
				},
			},
		],
	},
	"fal-ai/flux-pro/v1.1": {
		prices: [
			{
				validFrom: "2024-01-01T00:00:00Z",
				price: {
					type: "size",
					pricePerMegaPixel: 0.05,
				},
			},
		],
	},
	"fal-ai/stable-diffusion-v3-medium": {
		prices: [
			{
				validFrom: "2024-01-01T00:00:00Z",
				price: {
					type: "count",
					pricePerImage: 0.035,
				},
			},
		],
	},
} as const;

/**
 * Model ID groups sharing the same pricing
 */
const modelGroups = {
	gpt4: ["gpt-4o", "gpt-4.1", "gpt-4o-search-preview"],
	gpt4Mini: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o-mini-search-preview"],
} as const;

export const generateModelPrices = (): Record<string, ModelPriceConfig> => {
	const prices: Record<string, ModelPriceConfig> = {};

	// GPT-4 models
	for (const modelId of modelGroups.gpt4) {
		prices[modelId] = webSearchPricing.gpt4;
	}

	// GPT-4 Mini models
	for (const modelId of modelGroups.gpt4Mini) {
		prices[modelId] = webSearchPricing.gpt4Mini;
	}

	// Other models with unique pricing
	return {
		...prices,
		...perplexityTokenPrices,
		...perplexityRequestPrices,
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
					} satisfies TokenBasedPricing,
				} satisfies ModelPrice,
			],
		} satisfies ModelPriceConfig,
	};
};

interface LangfuseModelPrice {
	id: string;
	createdAt: string;
	modelName: string;
	matchPattern: string;
	startDate: null;
	unit: "TOKENS" | "CHARACTERS";
	inputPrice: number | null;
	outputPrice: number | null;
	totalPrice: number | null;
	tokenizerId: string | null;
	tokenizerConfig: unknown | null;
	isLangfuseManaged: boolean;
}

interface LangfuseMeta {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
}

interface LangfuseResponse {
	data: LangfuseModelPrice[];
	meta: LangfuseMeta;
}

export async function getModelPriceFromLangfuse(
	model: string,
): Promise<TokenBasedPricing> {
	try {
		const credentials = Buffer.from(
			`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`,
		).toString("base64");

		// Fetch first page to get metadata
		const firstPageResponse = await fetch(
			`${process.env.LANGFUSE_BASEURL}/api/public/models?page=1`,
			{
				method: "GET",
				headers: {
					Authorization: `Basic ${credentials}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!firstPageResponse.ok) {
			console.warn(
				`Failed to fetch models from Langfuse. Using default pricing.`,
			);
			return getDefaultPricing();
		}

		const firstPageData: LangfuseResponse = await firstPageResponse.json();
		const { totalPages } = firstPageData.meta;
		let allModels = [...firstPageData.data];

		// Fetch remaining pages
		const remainingPages = Array.from(
			{ length: totalPages - 1 },
			(_, i) => i + 2,
		);
		const remainingPagesPromises = remainingPages.map((page) =>
			fetch(`${process.env.LANGFUSE_BASEURL}/api/public/models?page=${page}`, {
				method: "GET",
				headers: {
					Authorization: `Basic ${credentials}`,
					"Content-Type": "application/json",
				},
			}).then((res) => res.json() as Promise<LangfuseResponse>),
		);

		const remainingPagesData = await Promise.all(remainingPagesPromises);
		allModels = allModels.concat(
			...remainingPagesData.map((response) => response.data),
		);

		// Find model using matchPattern
		const modelPrice = allModels.find((price) => {
			try {
				// Convert (?i) syntax to JavaScript's i flag
				const pattern = price.matchPattern.replace(/^\(\?i\)/, "");
				const regex = new RegExp(pattern, "i");
				return regex.test(model);
			} catch (e) {
				console.warn(`Invalid match pattern for model ${price.modelName}:`, e);
				return false;
			}
		});

		if (!modelPrice) {
			console.warn(
				`No pricing found for model ${model}. Using default pricing.`,
			);
			return getDefaultPricing();
		}

		// Convert "per-pixel" price to "per-megapixcels"
		const multiplier = modelPrice.unit === "TOKENS" ? 1_000_000 : 0;
		return {
			type: "token",
			input: {
				type: "token",
				costPerMegaToken: (modelPrice.inputPrice ?? 0) * multiplier,
			},
			output: {
				type: "token",
				costPerMegaToken: (modelPrice.outputPrice ?? 0) * multiplier,
			},
		} satisfies TokenBasedPricing;
	} catch (error) {
		console.error("Error fetching model price from Langfuse:", error);
		return getDefaultPricing();
	}
}

function getDefaultPricing(): TokenBasedPricing {
	return {
		type: "token",
		input: {
			type: "token",
			costPerMegaToken: 0,
		},
		output: {
			type: "token",
			costPerMegaToken: 0,
		},
	};
}

export const modelPrices = generateModelPrices();
export type FalModelId = keyof typeof falModelPrices;
export type FalModelPriceConfig = (typeof falModelPrices)[FalModelId];
