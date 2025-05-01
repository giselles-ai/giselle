import { z } from "zod";
import {
	AnthropicCostCalculator,
	LanguageModel as AnthropicLanguageModel,
	models as anthropicLanguageModels,
} from "./anthropic";
import {
	type CostCalculator,
	type CostResult,
	DefaultCostCalculator,
} from "./costs/calculator";
import type {
	ImageCountUsage,
	ImageSizeUsage,
	ImageUsage,
	ModelUsage,
	TokenUsage,
} from "./costs/usage";
import {
	FalCostCalculator,
	LanguageModel as FalLanguageModel,
	models as falLanguageModels,
} from "./fal";
import {
	GoogleCostCalculator,
	LanguageModel as GoogleLanguageModel,
	models as googleLanguageModels,
} from "./google";
import {
	OpenAICostCalculator,
	LanguageModel as OpenAILanguageModel,
	type OpenAIWebSearchConfig,
	models as openaiLanguageModels,
} from "./openai";
import {
	LanguageModel as OpenAIImageLanguageModel,
	models as openaiImageLanguageModels,
} from "./openai-image";
import {
	PerplexityCostCalculator,
	LanguageModel as PerplexityLanguageModel,
	models as perplexityLanguageModels,
} from "./perplexity";

export * from "./base";
export * from "./helper";
export {
	getImageGenerationModelProvider,
	falImageGenerationSizes as imageGenerationSizes,
	createUsageCalculator,
} from "./fal";
export type { FalImageResult, GeneratedImageData } from "./fal";
export {
	size as openaiImageSize,
	quality as openaiImageQuality,
	moderation as openaiImageModeration,
	background as openaiImageBackground,
	models as openaiImageModels,
} from "./openai-image";

export const LanguageModel = z.union([
	AnthropicLanguageModel,
	GoogleLanguageModel,
	OpenAILanguageModel,
	OpenAIImageLanguageModel,
	PerplexityLanguageModel,
	FalLanguageModel,
]);
export type LanguageModel = z.infer<typeof LanguageModel>;

export const languageModels = [
	...googleLanguageModels,
	...anthropicLanguageModels,
	...openaiLanguageModels,
	...openaiImageLanguageModels,
	...perplexityLanguageModels,
	...falLanguageModels,
];

export {
	AnthropicLanguageModel,
	GoogleLanguageModel,
	OpenAILanguageModel,
	OpenAIImageLanguageModel,
	PerplexityLanguageModel,
	FalLanguageModel,
	anthropicLanguageModels,
	openaiLanguageModels,
	googleLanguageModels,
	perplexityLanguageModels,
	falLanguageModels,
};

export const LanguageModelProviders = z.enum([
	AnthropicLanguageModel.shape.provider.value,
	GoogleLanguageModel.shape.provider.value,
	OpenAILanguageModel.shape.provider.value,
	OpenAIImageLanguageModel.shape.provider.value,
	PerplexityLanguageModel.shape.provider.value,
	FalLanguageModel.shape.provider.value,
]);
export type LanguageModelProvider = z.infer<typeof LanguageModelProviders>;

const costCalculators = {
	fal: {
		default: new FalCostCalculator(),
	},
	google: {
		default: new GoogleCostCalculator(),
	},
	openai: {
		default: new OpenAICostCalculator(),
	},
	anthropic: {
		default: new AnthropicCostCalculator(),
	},
	perplexity: {
		default: new PerplexityCostCalculator(),
	},
} as const;

function getCostCalculator(
	provider: LanguageModelProvider,
	model: string,
): CostCalculator<any, any> {
	const providerCalculators =
		costCalculators[provider as keyof typeof costCalculators];
	return providerCalculators?.default ?? new DefaultCostCalculator(provider);
}

export async function calculateModelCost(
	provider: LanguageModelProvider,
	model: string,
	toolConfig: OpenAIWebSearchConfig | undefined,
	usage: ModelUsage,
): Promise<CostResult> {
	const defaultResult: CostResult = { input: 0, output: 0, total: 0 };

	switch (provider) {
		case "google":
		case "openai":
		case "anthropic":
		case "perplexity": {
			const calculator = getCostCalculator(provider, model);
			if (isTokenUsage(usage)) {
				return calculator.calculate(model, toolConfig, usage);
			}
			console.log(
				`TokenUsage type needed to calculate cost of ${provider} model`,
			);
			return defaultResult;
		}
		case "fal": {
			const calculator = getCostCalculator(provider, model);
			if (isImageUsage(usage)) {
				return calculator.calculate(model, toolConfig, usage);
			}
			console.log(`ImageUsage type needed to calculate cost of Fal model`);
			return defaultResult;
		}
		default: {
			console.log("Unknown provider");
			return defaultResult;
		}
	}
}

function isTokenUsage(usage: ModelUsage): usage is TokenUsage {
	return (
		typeof (usage as TokenUsage).promptTokens === "number" &&
		typeof (usage as TokenUsage).completionTokens === "number" &&
		typeof (usage as TokenUsage).totalTokens === "number"
	);
}
function isImageUsage(usage: any): usage is ImageUsage {
	return (
		typeof usage === "object" &&
		usage !== null &&
		("nOfImages" in usage || "pixelDimensions" in usage) &&
		(("nOfImages" in usage && typeof usage.nOfImages === "number") ||
			("pixelDimensions" in usage && typeof usage.pixelDimensions === "string"))
	);
}
function isImageCountUsage(usage: ImageUsage): usage is ImageCountUsage {
	return "nOfImages" in usage && typeof usage.nOfImages === "number";
}
function isImageSizeUsage(usage: ImageUsage): usage is ImageSizeUsage {
	return (
		"pixelDimensions" in usage && typeof usage.pixelDimensions === "string"
	);
}
