import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { ContentGenerationContent } from "@giselles-ai/protocol";

export function buildLanguageModelOptions({
	languageModel,
}: {
	languageModel: ContentGenerationContent["languageModel"];
}) {
	switch (languageModel.id) {
		case "openai/gpt-5":
		case "openai/gpt-5-codex":
		case "openai/gpt-5-mini":
		case "openai/gpt-5-nano":
		case "openai/gpt-5.1-codex":
		case "openai/gpt-5.1-thinking":
			return {
				[languageModel.provider]: languageModel.configuration,
			};
		case "anthropic/claude-haiku-4-5":
		case "anthropic/claude-opus-4.1":
		case "anthropic/claude-sonnet-4-5": {
			const thinking = Boolean(languageModel.configuration.thinking);
			if (thinking) {
				return {
					anthropic: {
						thinking: {
							type: "enabled",
							budgetTokens: 12000,
						},
					} satisfies AnthropicProviderOptions,
				};
			}
			return {
				anthropic: {
					thinking: {
						type: "enabled",
						budgetTokens: 12000,
					},
				} satisfies AnthropicProviderOptions,
			};
		}
    case 'google/gemini-3-pro-preview': {
      const thinkingLevel = languageModel.configuration.thinkingLevel
      return {
        google: {
          thinkingConfig: {
            th
          }

        } satisfies GoogleGenerativeAIProviderOptions
      }
    }
		case "google/gemini-2.5-pro":
		case "google/gemini-2.5-flash":
		case "google/gemini-2.5-flash-lite":
	}
	// 		case 'google': {
	// 		switch(languageModel.id) {
	// 		case ''
	// 		}

	// 		}
	// 	}
	// 	return {
	// 		[languageModel.provider]: languageModel.configuration,
	// 	};
	// }
}
