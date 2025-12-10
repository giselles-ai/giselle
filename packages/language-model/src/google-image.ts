import * as z from "zod/v4";
import { Capability, LanguageModelBase } from "./base";

const GoogleImageModelConfigurations = z.object({
	responseModalities: z.array(z.literal("IMAGE")),
});
type GoogleImageModelConfiguration = z.infer<
	typeof GoogleImageModelConfigurations
>;

const defaultConfiguration: GoogleImageModelConfiguration = {
	responseModalities: ["IMAGE"],
};

const GoogleImageLanguageModelId = z
	.enum(["gemini-2.5-flash-image"])
	.catch("gemini-2.5-flash-image");

const GoogleImageLanguageModel = LanguageModelBase.extend({
	id: GoogleImageLanguageModelId,
	provider: z.literal("google"),
	configurations: GoogleImageModelConfigurations,
});
type GoogleImageLanguageModel = z.infer<typeof GoogleImageLanguageModel>;

const gemini25FlashImage: GoogleImageLanguageModel = {
	provider: "google",
	id: "gemini-2.5-flash-image",
	capabilities:
		Capability.ImageGeneration |
		Capability.ImageFileInput |
		Capability.ImageGenerationInput,
	tier: "pro",
	configurations: defaultConfiguration,
};

export const models = [gemini25FlashImage];

export const LanguageModel = GoogleImageLanguageModel;
export type LanguageModel = GoogleImageLanguageModel;
