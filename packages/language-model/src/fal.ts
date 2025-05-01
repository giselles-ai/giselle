import type { Result } from "@fal-ai/client";
import { z } from "zod";
import { Capability, LanguageModelBase } from "./base";
import type { CostCalculator, CostResult } from "./costs/calculator";
import { type FalModelId, falModelPrices } from "./costs/model-prices";
import type { ImageUsage } from "./costs/usage";

const imageGenerationSize1x1 = z.literal("512x512");
const imageGenerationSize1x1Hd = z.literal("1024x1024");
const imageGenerationSize4x3 = z.literal("1152x864");
const imageGenerationSize16x9 = z.literal("1312x736");

export const falImageGenerationSizes = z.enum([
	imageGenerationSize1x1.value,
	imageGenerationSize1x1Hd.value,
	imageGenerationSize4x3.value,
	imageGenerationSize16x9.value,
]);

export const FalLanguageModelConfigurations = z.object({
	n: z.number(),
	size: falImageGenerationSizes,
});
export type FalLanguageModelConfigurations = z.infer<
	typeof FalLanguageModelConfigurations
>;

const defaultConfiguration: FalLanguageModelConfigurations = {
	n: 1,
	size: imageGenerationSize1x1.value,
};

const FalLanguageModel = LanguageModelBase.extend({
	provider: z.literal("fal"),
	configurations: FalLanguageModelConfigurations,
});
type FalLanguageModel = z.infer<typeof FalLanguageModel>;

const falFluxSchnell: FalLanguageModel = {
	provider: "fal",
	id: "fal-ai/flux/schnell",
	capabilities: Capability.ImageGeneration,
	tier: "free",
	configurations: defaultConfiguration,
};

const falFluxPro11: FalLanguageModel = {
	provider: "fal",
	id: "fal-ai/flux-pro/v1.1",
	capabilities: Capability.ImageGeneration,
	tier: "pro",
	configurations: defaultConfiguration,
};

// const falRecraft20b: FalLanguageModel = {
// 	provider: "fal",
// 	id: "fal-ai/recraft-20b",
// 	capabilities: Capability.ImageGeneration,
// 	tier: "pro",
// 	configurations: defaultConfiguration,
// };

// const falRecraftv3: FalLanguageModel = {
// 	provider: "fal",
// 	id: "fal-ai/recraft-v3",
// 	capabilities: Capability.ImageGeneration,
// 	tier: "pro",
// 	configurations: defaultConfiguration,
// };

// const falIdeogramV2Turbo: FalLanguageModel = {
// 	provider: "fal",
// 	id: "fal-ai/ideogram/v2/turbo",
// 	capabilities: Capability.ImageGeneration,
// 	tier: "pro",
// 	configurations: defaultConfiguration,
// };

const falStableDiffusion35Med: FalLanguageModel = {
	provider: "fal",
	id: "fal-ai/stable-diffusion-v3-medium",
	capabilities: Capability.ImageGeneration,
	tier: "pro",
	configurations: defaultConfiguration,
};

export const models = [
	falFluxSchnell,
	falFluxPro11,
	// falRecraft20b,
	// falRecraftv3,
	// falIdeogramV2Turbo,
	falStableDiffusion35Med,
];

export const LanguageModel = FalLanguageModel;
export type LanguageModel = FalLanguageModel;

type ImageGenerationModelProvider =
	| "flux"
	| "recraft"
	| "ideogram"
	| "stable-diffusion";

export function getImageGenerationModelProvider(
	provider: string,
): ImageGenerationModelProvider | undefined {
	// Extract model family from the model ID
	// E.g., "fal-ai/flux/schnell" -> "flux"
	// E.g., "fal-ai/stable-diffusion-3.5-medium" -> "stable-diffusion"

	const parts = provider.split("/");
	if (parts.length < 2) return undefined;

	// Handle different model naming patterns
	if (parts[1] === "flux" || parts[1] === "flux-pro") {
		return "flux";
	}
	if (parts[1].startsWith("recraft")) {
		return "recraft";
	}
	if (parts[1] === "ideogram") {
		return "ideogram";
	}
	if (parts[1].startsWith("stable-diffusion")) {
		return "stable-diffusion";
	}

	return undefined;
}

export interface FalImage {
	url: string;
	width: number;
	height: number;
	content_type: string;
}

export interface UsageCalculator {
	calculateUsage(images: FalImage[]): {
		output: number;
		unit: "IMAGES";
	};
}

export function calculateMegaPixels(size: string): number {
	const [width, height] = size.split("x").map(Number);
	return (width * height) / 1_000_000;
}

export function roundUpToNearestMegaPixel(megaPixels: number): number {
	return Math.ceil(megaPixels);
}

export class PixelBasedUsageCalculator implements UsageCalculator {
	calculateUsage(images: FalImage[]) {
		const totalPixels = images.reduce((sum, image) => {
			if (typeof image.width === "string" && typeof image.height === "string") {
				return sum + calculateMegaPixels(`${image.width}x${image.height}`);
			}
			return sum + (image.height * image.width) / 1_000_000;
		}, 0);
		return {
			output: roundUpToNearestMegaPixel(totalPixels) * 1_000_000,
			unit: "IMAGES" as const,
		};
	}
}

export class ImageCountBasedUsageCalculator implements UsageCalculator {
	calculateUsage(images: FalImage[]) {
		return {
			output: images.length,
			unit: "IMAGES" as const,
		};
	}
}

export function createUsageCalculator(modelId: string): UsageCalculator {
	switch (modelId) {
		case "fal-ai/stable-diffusion-v3-medium":
			return new ImageCountBasedUsageCalculator();
		default:
			return new PixelBasedUsageCalculator();
	}
}

interface FalImageData {
	images: FalImage[];
	timings: {
		inference: number;
	};
	seed: number;
	has_nsfw_concepts: boolean[];
	prompt: string;
}

export type FalImageResult = Result<FalImageData>;

export interface GeneratedImageData {
	uint8Array: Uint8Array;
	base64: string;
}

interface FalPriceConfigBase {
	type: string;
}

interface FalImageCountBasedPrice extends FalPriceConfigBase {
	type: "count";
	pricePerImage: number;
}

interface FalImageSizeBasedPrice extends FalPriceConfigBase {
	type: "size";
	pricePerMegaPixel: number;
}

type FalPriceConfig = FalImageCountBasedPrice | FalImageSizeBasedPrice;

export function calculateFalCost(
	usage: ImageUsage,
	priceConfig: FalImageSizeBasedPrice | FalImageCountBasedPrice,
): number {
	if ("nOfImages" in usage && priceConfig.type === "count") {
		return usage.nOfImages * priceConfig.pricePerImage;
	}

	if ("pixelDimensions" in usage && priceConfig.type === "size") {
		const rawMegaPixels = calculateMegaPixels(usage.pixelDimensions);
		const roundedMegaPixels = roundUpToNearestMegaPixel(rawMegaPixels);
		return roundedMegaPixels * priceConfig.pricePerMegaPixel;
	}

	return 0;
}

export class FalCostCalculator implements CostCalculator<any, ImageUsage> {
	async calculate(
		model: string,
		toolConfig: undefined,
		usage: ImageUsage,
	): Promise<CostResult> {
		const modelConfig = falModelPrices[model as FalModelId];
		if (!modelConfig) {
			console.log("unknown model");
			return { input: 0, output: 0, total: 0 };
		}

		const prices = [...modelConfig.prices];
		const latestPrice = prices
			.sort(
				(a, b) =>
					new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime(),
			)
			.find((price) => new Date(price.validFrom) <= new Date());

		if (!latestPrice) {
			console.log("no valid price found");
			return { input: 0, output: 0, total: 0 };
		}

		const costInUsd = calculateFalCost(usage, latestPrice.price);

		return {
			input: 0,
			output: costInUsd,
			total: costInUsd,
		};
	}
}
