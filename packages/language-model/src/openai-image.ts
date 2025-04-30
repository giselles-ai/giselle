import { z } from "zod";
import { Capability, LanguageModelBase } from "./base";

export const size = z.enum(["1024x1024", "1536x1024", "1024x1536"]);

export const quality = z.enum(["auto", "high", "medium", "low"]);

export const moderation = z.enum(["auto", "low"]);

export const background = z.enum(["transparent", "opaque", "auto"]);

export const OpenAIImageModelConfigurations = z.object({
	n: z.number(),
	size,
	quality,
	moderation,
	background,
});
export type OpenAIImageModelConfiguration = z.infer<
	typeof OpenAIImageModelConfigurations
>;

const defaultConfiguration: OpenAIImageModelConfiguration = {
	n: 1,
	size: "1024x1024",
	quality: "auto",
	moderation: "auto",
	background: "auto",
};

const OpenAIImageLanguageModel = LanguageModelBase.extend({
	provider: z.literal("openai"),
	configurations: OpenAIImageModelConfigurations,
});
type OpenAIImageLanguageModel = z.infer<typeof OpenAIImageLanguageModel>;

const openaiGptImage1: OpenAIImageLanguageModel = {
	provider: "openai",
	id: "gpt-image-1",
	capabilities: Capability.ImageGeneration,
	tier: "pro",
	configurations: defaultConfiguration,
};

export const models = [openaiGptImage1];

export const LanguageModel = OpenAIImageLanguageModel;
export type LanguageModel = OpenAIImageLanguageModel;
