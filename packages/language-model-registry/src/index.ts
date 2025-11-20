export * from "./language-model";

import { anthropic } from "./anthropic";
import { google } from "./google";
import { openai } from "./openai";

export const languageModels = [
	...Object.values(openai),
	...Object.values(anthropic),
	...Object.values(google),
];

export const languageModelIds = languageModels.map((model) => model.id);
export type LanguageModelId = (typeof languageModelIds)[number];
export function isLanguageModelId(id: unknown): id is LanguageModelId {
	return languageModelIds.includes(id as LanguageModelId);
}

export const languageModelProviders = languageModels.map(
	(model) => model.provider,
);

export function isLanguageModelProvider(
	provider: unknown,
): provider is LanguageModelProvider {
	return languageModelProviders.includes(provider as LanguageModelProvider);
}

export type LanguageModelProvider = (typeof languageModelProviders)[number];

export function getEntry(languageModelId: LanguageModelId) {
	const languageModel = languageModels.find(
		(model) => model.id === languageModelId,
	);

	if (!languageModel) {
		throw new Error(`Language model with ID ${languageModelId} not found`);
	}

	return languageModel;
}
