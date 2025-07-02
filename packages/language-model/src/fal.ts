import { z } from "zod/v4";
import { Capability, LanguageModelBase, type UsageCalculator } from "./base";

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

const FalLanguageModelId = z
	.enum([
		"fal-ai/flux/schnell",
		"fal-ai/flux-pro/v1.1",
		"fal-ai/stable-diffusion-v3-medium",
	])
	.catch("fal-ai/flux/schnell");

const FalLanguageModel = LanguageModelBase.extend({
	id: FalLanguageModelId,
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

export interface FalImageGenerationParams {
	width: number;
	height: number;
	n: number;
}

export class PixelBasedUsageCalculator implements UsageCalculator {
	calculateUsage({ width, height, n }: FalImageGenerationParams) {
		const totalPixels = width * height * n;
		return {
			output: Math.ceil(totalPixels / 1_000_000) * 1_000_000,
			unit: "IMAGES" as const,
		};
	}
}

export class ImageCountBasedUsageCalculator implements UsageCalculator {
	calculateUsage({ n }: { width: number; height: number; n: number }) {
		return {
			output: n,
			unit: "IMAGES" as const,
		};
	}
}

export interface GeneratedImageData {
	uint8Array: Uint8Array;
	base64: string;
}
