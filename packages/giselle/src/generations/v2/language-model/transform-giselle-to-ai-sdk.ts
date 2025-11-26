import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { LanguageModelV2CallOptions } from "@ai-sdk/provider";
import {
	getEntry,
	parseConfiguration,
} from "@giselles-ai/language-model-registry";
import type { ContentGenerationContent } from "@giselles-ai/protocol";

export function transformGiselleLanguageModelToAiSdkLanguageModelCallOptions(
	content: ContentGenerationContent,
): Pick<LanguageModelV2CallOptions, "temperature" | "providerOptions"> {
	const languageModel = getEntry(content.languageModel.id);
	switch (languageModel.id) {
		case "openai/gpt-5":
		case "openai/gpt-5-codex":
		case "openai/gpt-5-mini":
		case "openai/gpt-5-nano":
		case "openai/gpt-5.1-codex":
		case "openai/gpt-5.1-thinking": {
			const config = parseConfiguration(
				languageModel,
				content.languageModel.configuration,
			);
			return {
				providerOptions: {
					openai: {
						reasoningEffort: config.reasoningEffort,
						textVerbosity: config.textVerbosity,
					} satisfies OpenAIResponsesProviderOptions,
				},
			} satisfies Partial<LanguageModelV2CallOptions>;
		}
		case "anthropic/claude-haiku-4-5":
		case "anthropic/claude-opus-4.1":
		case "anthropic/claude-sonnet-4-5": {
			const config = parseConfiguration(
				languageModel,
				content.languageModel.configuration,
			);
			if (config.thinking) {
				return {
					temperature: config.temperature,
					providerOptions: {
						anthropic: {
							thinking: {
								type: "enabled",
								budgetTokens: 12000,
							},
						} satisfies AnthropicProviderOptions,
					},
				} satisfies Partial<LanguageModelV2CallOptions>;
			}
			return {
				providerOptions: {
					anthropic: {
						thinking: {
							type: "enabled",
							budgetTokens: 12000,
						},
					} satisfies AnthropicProviderOptions,
				} as Partial<LanguageModelV2CallOptions>,
			};
		}
		case "google/gemini-3-pro-preview": {
			const config = parseConfiguration(
				languageModel,
				content.languageModel.configuration,
			);
			return {
				temperature: config.temperature,
				providerOptions: {
					google: {
						thinkingConfig: {
							thinkingLevel: config.thinkingLevel,
						},
					} satisfies GoogleGenerativeAIProviderOptions,
				},
			} satisfies Partial<LanguageModelV2CallOptions>;
		}
		case "google/gemini-2.5-flash":
		case "google/gemini-2.5-flash-lite":
		case "google/gemini-2.5-pro": {
			const config = parseConfiguration(
				languageModel,
				content.languageModel.configuration,
			);
			return {
				temperature: config.temperature,
				providerOptions: {
					google: {
						thinkingConfig: {
							// You can disable thinking by setting thinkingBudget to 0. Setting the thinkingBudget to -1 turns on dynamic thinking, meaning the model will adjust the budget based on the complexity of the request.
							// https://ai.google.dev/gemini-api/docs/thinking#set-budget
							thinkingBudget: config.thinking ? -1 : 0,
						},
					} satisfies GoogleGenerativeAIProviderOptions,
				},
			} satisfies Partial<LanguageModelV2CallOptions>;
		}
	}
}
