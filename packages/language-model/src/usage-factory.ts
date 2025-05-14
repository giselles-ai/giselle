import type { UsageCalculator } from "./base";
import {
	ImageCountBasedUsageCalculator,
	PixelBasedUsageCalculator,
} from "./fal";
import { OpenAIImageGenerationUsageCalculator } from "./openai-image";

const usageCalculatorMap: Record<string, UsageCalculator> = {
	"fal-ai/stable-diffusion-v3-medium": new ImageCountBasedUsageCalculator(),
	"fal-ai/flux/schnell": new PixelBasedUsageCalculator(),
	"fal-ai/flux-pro/v1.1": new PixelBasedUsageCalculator(),
	"gpt-image-1": new OpenAIImageGenerationUsageCalculator(),
};

export function createUsageCalculator(modelId: string): UsageCalculator {
	if (usageCalculatorMap[modelId]) {
		return usageCalculatorMap[modelId];
	}
	throw new Error(`Unknown model: ${modelId}`);
}
