import { z } from "zod/v4";
import { Capability, LanguageModelBase, type UsageCalculator } from "./base";

export const size = z.enum(["1024x1024", "1536x1024", "1024x1536"]);

export const quality = z.enum(["auto", "high", "medium", "low"]);

export const moderation = z.enum(["auto", "low"]);

export const background = z.enum(["transparent", "opaque", "auto"]);

const OpenAIImageModelConfigurations = z.object({
	n: z.number(),
	size,
	quality,
	moderation,
	background,
});
type OpenAIImageModelConfiguration = z.infer<
	typeof OpenAIImageModelConfigurations
>;

const defaultConfiguration: OpenAIImageModelConfiguration = {
	n: 1,
	size: "1024x1024",
	quality: "auto",
	moderation: "auto",
	background: "auto",
};

const OpenAIImageLanguageModelId = z.enum(["gpt-image-1"]).catch("gpt-image-1");

const OpenAIImageLanguageModel = LanguageModelBase.extend({
	id: OpenAIImageLanguageModelId,
	provider: z.literal("openai"),
	configurations: OpenAIImageModelConfigurations,
});
type OpenAIImageLanguageModel = z.infer<typeof OpenAIImageLanguageModel>;

const openaiGptImage1: OpenAIImageLanguageModel = {
	provider: "openai",
	id: "gpt-image-1",
	capabilities: Capability.ImageGeneration | Capability.ImageFileInput,
	tier: "pro",
	configurations: defaultConfiguration,
};

export const models = [openaiGptImage1];

export const LanguageModel = OpenAIImageLanguageModel;
export type LanguageModel = OpenAIImageLanguageModel;

interface OpenAIImageGenerationParams {
	width: number;
	height: number;
	quality: "auto" | "low" | "medium" | "high";
}

const openAICostTable: Record<
	"auto" | "low" | "medium" | "high",
	Record<string, number>
> = {
	// pricing table: https://platform.openai.com/docs/pricing#image-generation
	low: {
		"1024x1024": 0.011,
		"1024x1536": 0.016,
		"1536x1024": 0.016,
	},
	medium: {
		"1024x1024": 0.042,
		"1024x1536": 0.063,
		"1536x1024": 0.063,
	},
	high: {
		"1024x1024": 0.167,
		"1024x1536": 0.25,
		"1536x1024": 0.25,
	},
	auto: {
		// price is set same as "medium" because we cannot detect which quality is finaly adopted by OpenAI
		// ref: https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1#customize-image-output
		"1024x1024": 0.042,
		"1024x1536": 0.063,
		"1536x1024": 0.063,
	},
};

function getSizeKey(width: number, height: number): string {
	return `${width}x${height}`;
}

export class OpenAIImageGenerationUsageCalculator implements UsageCalculator {
	calculateUsage({ width, height, quality }: OpenAIImageGenerationParams) {
		const totalPixels = width * height;
		const price = openAICostTable[quality][getSizeKey(width, height)];
		if (price === undefined) {
			console.error(
				`Unsupported size or quality: ${width}x${height}, ${quality}`,
			);
		}
		return {
			output: totalPixels,
			outputCost: price ?? 0,
			totalCost: price ?? 0,
			unit: "IMAGES" as const,
		};
	}
}
