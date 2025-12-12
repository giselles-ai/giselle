import {
	AnthropicLanguageModelData,
	GoogleLanguageModelData,
	OpenAILanguageModelData,
	type TextGenerationLanguageModelData,
} from "@giselles-ai/protocol";

type Provider = "openai" | "anthropic" | "google";

/**
 * Returns the default reasoningEffort for the given OpenAI model.
 *
 * GPT-5.2 and GPT-5.1 variants default to "none" for lower latency.
 * Older models (gpt-5, gpt-5-mini, gpt-5-nano) default to "medium".
 *
 * @see https://platform.openai.com/docs/guides/latest-model#gpt-5-2-parameter-compatibility
 */
function getDefaultReasoningEffort(modelId: string): string {
	if (
		modelId === "gpt-5.2" ||
		modelId === "gpt-5.1-thinking" ||
		modelId === "gpt-5.1-codex"
	) {
		return "none";
	}
	return "medium";
}

export function createDefaultModelData(
	provider: Provider,
): TextGenerationLanguageModelData {
	switch (provider) {
		case "openai":
			return OpenAILanguageModelData.parse({
				provider: "openai",
				id: "gpt-5-nano",
				configurations: {
					temperature: 0.7,
					topP: 1.0,
					frequencyPenalty: 0.0,
					presencePenalty: 0.0,
				},
			});
		case "anthropic":
			return AnthropicLanguageModelData.parse({
				provider: "anthropic",
				id: "claude-haiku-4.5",
				configurations: {
					temperature: 0.7,
					topP: 1.0,
					reasoningText: false,
				},
			});
		case "google":
			return GoogleLanguageModelData.parse({
				provider: "google",
				id: "gemini-2.5-flash-lite-preview-06-17",
				configurations: {
					temperature: 0.7,
					topP: 1.0,
					searchGrounding: false,
				},
			});
		default: {
			const _exhaustiveCheck: never = provider;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
}

export function updateModelId(
	currentModel: TextGenerationLanguageModelData,
	newModelId: string,
): TextGenerationLanguageModelData {
	switch (currentModel.provider) {
		case "openai":
			return OpenAILanguageModelData.parse({
				...currentModel,
				id: newModelId,
				configurations: {
					...("configurations" in currentModel
						? currentModel.configurations
						: {}),
					reasoningEffort: getDefaultReasoningEffort(newModelId),
				},
			});
		case "anthropic":
			return AnthropicLanguageModelData.parse({
				...currentModel,
				id: newModelId,
			});
		case "google":
			return GoogleLanguageModelData.parse({
				...currentModel,
				id: newModelId,
			});
		case "perplexity":
			// Perplexity is deprecated, convert to OpenAI as a fallback
			return OpenAILanguageModelData.parse({
				provider: "openai",
				id: "gpt-5-nano",
				configurations: {
					temperature: 0.7,
					topP: 1.0,
					frequencyPenalty: 0.0,
					presencePenalty: 0.0,
				},
			});
		default: {
			const _exhaustiveCheck: never = currentModel;
			throw new Error(
				`Unhandled provider: ${JSON.stringify(_exhaustiveCheck)}`,
			);
		}
	}
}
