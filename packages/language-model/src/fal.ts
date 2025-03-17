import { z } from "zod";
import { Capability, LanguageModelBase } from "./base";

const FalLanguageModelSize1x1 = z.literal("512x512");
const FalLanguageModelSize1x1Hd = z.literal("1024x1024");
const FalLanguageModelSize4x3 = z.literal("1152x864");
const FalLanguageModelSize16x9 = z.literal("1312x736");

export const FalLanguageModelConfigurations = z.object({
	n: z.number().optional(),
	size: z.optional(
		z.enum([
			FalLanguageModelSize1x1.value,
			FalLanguageModelSize1x1Hd.value,
			FalLanguageModelSize4x3.value,
			FalLanguageModelSize16x9.value,
		]),
	),
});
export type FalLanguageModelConfigurations = z.infer<
	typeof FalLanguageModelConfigurations
>;

const defaultConfiguration: FalLanguageModelConfigurations = {
	n: 1,
	size: FalLanguageModelSize1x1.value,
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

const falRecraft20b: FalLanguageModel = {
	provider: "fal",
	id: "fal-ai/recraft-20b",
	capabilities: Capability.ImageGeneration,
	tier: "pro",
	configurations: defaultConfiguration,
};

const falRecraftv3: FalLanguageModel = {
	provider: "fal",
	id: "fal-ai/recraft-v3",
	capabilities: Capability.ImageGeneration,
	tier: "pro",
	configurations: defaultConfiguration,
};

const falIdeogramV2Turbo: FalLanguageModel = {
	provider: "fal",
	id: "fal-ai/ideogram/v2/turbo",
	capabilities: Capability.ImageGeneration,
	tier: "pro",
	configurations: defaultConfiguration,
};

const falStableDiffusion35Med: FalLanguageModel = {
	provider: "fal",
	id: "fal-ai/stable-diffusion-3.5-medium",
	capabilities: Capability.ImageGeneration,
	tier: "pro",
	configurations: defaultConfiguration,
};

export const models = [
	falFluxSchnell,
	falFluxPro11,
	falRecraft20b,
	falRecraftv3,
	falIdeogramV2Turbo,
	falStableDiffusion35Med,
];

export const LanguageModel = FalLanguageModel;
export type LanguageModel = FalLanguageModel;
