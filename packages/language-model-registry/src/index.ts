export * from "./language-model";

import { anthropic } from "./anthropic";
import { google } from "./google";
import { openai } from "./openai";

export const languageModels = {
	...openai,
	...anthropic,
	...google,
};

export const languageModelIds = Array.from(
	new Set(Object.values(languageModels).map((model) => model.id)),
);
export type LanguageModelId = (typeof languageModelIds)[number];
export function isLanguageModelId(id: unknown): id is LanguageModelId {
	return languageModelIds.includes(id as LanguageModelId);
}

export const languageModelProviders = Array.from(
	new Set(Object.values(languageModels).map((model) => model.provider)),
);

export function isLanguageModelProvider(
	provider: unknown,
): provider is LanguageModelProvider {
	return languageModelProviders.includes(provider as LanguageModelProvider);
}

export type LanguageModelProvider = (typeof languageModelProviders)[number];
