import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { LanguageModel } from "@giselle-sdk/language-model";
import type { ToolSet } from "ai";

type TelemetryTag =
	// generic name
	| "web-search"
	// provider-specific function name
	| "openai:web-search"
	| "google:search-grounding"
	| "anthropic:reasoning"
	| "anthropic:thinking";

export function generateTelemetryTags(args: {
	provider: string;
	languageModel: LanguageModel;
	toolSet: ToolSet;
	configurations: Record<string, unknown>;
	providerOptions?: {
		anthropic?: AnthropicProviderOptions;
	};
}): TelemetryTag[] {
	const tags: TelemetryTag[] = [];

	// OpenAI Web Search
	if (args.provider === "openai" && args.toolSet.openaiWebSearch) {
		tags.push("web-search", "openai:web-search");
	}

	// Google Search Grounding
	if (args.provider === "google" && args.configurations.searchGrounding) {
		tags.push("web-search", "google:search-grounding");
	}

	// Anthropic Reasoning/Thinking
	if (args.provider === "anthropic") {
		if (args.configurations.reasoning) {
			tags.push("anthropic:reasoning");
		}
		if (args.providerOptions?.anthropic?.thinking?.type === "enabled") {
			// treat as an independent tag because extended thinking is available only on specific models
			// ref: https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
			tags.push("anthropic:thinking");
		}
	}

	return tags;
}
