import type { TelemetrySettings as AI_TelemetrySettings } from "ai";

export interface TelemetrySettings {
	metadata?: AI_TelemetrySettings["metadata"];
}

export type BaseFunctionalityTag = "web-search";

export type ProviderNameTag = "openai" | "anthropic" | "google" | "perplexity";

export type ProviderOptionTag =
	| "openai:web-search"
	| "google:search-grounding"
	| "anthropic:reasoning"
	| "anthropic:thinking"
	| "perplexity:search-domain-filter";

export type ModelNameTag = string;

export type TelemetryTag = string;

export type AnthropicProviderOptions = {
	thinking?: {
		type: "enabled" | "disabled";
	};
};

export type ToolSet = {
	openaiWebSearch?: boolean;
	github?: string[];
	postgres?: string[];
};
