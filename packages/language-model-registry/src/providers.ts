import type { LanguageModelProviderDefinition } from "./language-model";

type ProviderMetadata = {
	website: string;
	documentationUrl: string;
};

export const openaiProvider = {
	id: "openai",
	title: "OpenAI",
	metadata: {
		website: "https://openai.com",
		documentationUrl: "https://platform.openai.com/docs",
	},
} as const satisfies LanguageModelProviderDefinition<
	"openai",
	ProviderMetadata
>;

export const anthropicProvider = {
	id: "anthropic",
	title: "Anthropic",
	metadata: {
		website: "https://www.anthropic.com",
		documentationUrl: "https://docs.anthropic.com/en/docs",
	},
} as const satisfies LanguageModelProviderDefinition<
	"anthropic",
	ProviderMetadata
>;

export const googleProvider = {
	id: "google",
	title: "Google",
	metadata: {
		website: "https://ai.google.dev",
		documentationUrl: "https://ai.google.dev/gemini-api/docs",
	},
} as const satisfies LanguageModelProviderDefinition<
	"google",
	ProviderMetadata
>;
