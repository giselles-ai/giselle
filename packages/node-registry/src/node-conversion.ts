import {
	AnthropicLanguageModelId,
	GoogleLanguageModelId,
	OpenAILanguageModelId,
} from "@giselles-ai/language-model";
import {
	getEntry,
	type LanguageModelId,
} from "@giselles-ai/language-model-registry";
import {
	type ContentGenerationNode,
	SecretId,
	type TextGenerationNode,
} from "@giselles-ai/protocol";

// Legacy model IDs that are no longer in the current schema but may exist in stored data
type LegacyAnthropicModelId =
	| "claude-opus-4-1-20250805"
	| "claude-sonnet-4-5-20250929"
	| "claude-haiku-4-5-20251001";
type LegacyOpenAiModelId = "gpt-5-codex";
type TextGenerationModelIdWithLegacy =
	| TextGenerationNode["content"]["llm"]["id"]
	| LegacyAnthropicModelId
	| LegacyOpenAiModelId;

function convertTextGenerationLanguageModelIdToContentGenerationLanguageModelId(
	from: TextGenerationModelIdWithLegacy,
): LanguageModelId {
	switch (from) {
		case "claude-opus-4.6":
			return "anthropic/claude-opus-4.6";
		case "claude-haiku-4.5":
		case "claude-haiku-4-5-20251001":
			return "anthropic/claude-haiku-4.5";
		case "claude-opus-4.5":
		case "claude-opus-4-1-20250805":
			return "anthropic/claude-opus-4.5";
		case "claude-sonnet-4.5":
		case "claude-sonnet-4-5-20250929":
			return "anthropic/claude-sonnet-4.5";
		case "gemini-2.5-flash":
			return "google/gemini-2.5-flash";
		case "gemini-2.5-flash-lite":
			return "google/gemini-2.5-flash-lite";
		case "gemini-3-pro-preview":
			return "google/gemini-3-pro-preview";
		case "gemini-3-flash":
			return "google/gemini-3-flash";
		case "gemini-2.5-pro":
			return "google/gemini-2.5-pro";
		case "gpt-5.2":
			return "openai/gpt-5.2";
		case "gpt-5.2-codex":
			return "openai/gpt-5.2-codex";
		case "gpt-5.1-thinking":
			return "openai/gpt-5.1-thinking";
		case "gpt-5":
			return "openai/gpt-5";
		case "gpt-5-mini":
			return "openai/gpt-5-mini";
		case "gpt-5.1-codex":
			return "openai/gpt-5.1-codex";
		case "gpt-5-codex":
			return "openai/gpt-5.1-codex";
		case "gpt-5-nano":
			return "openai/gpt-5-nano";
		case "sonar":
		case "sonar-pro":
			// fallback to gpt-5-nano
			// @todo discuss policy/strategy
			return "openai/gpt-5-nano";
		default: {
			const _exhaustiveCheck: never = from;
			throw new Error(`Unknown language model id: ${_exhaustiveCheck}`);
		}
	}
}

function convertContentGenerationLanguageModelIdToTextGenerationLanguageModelId(
	from: LanguageModelId,
): TextGenerationNode["content"]["llm"]["id"] {
	switch (from) {
		case "anthropic/claude-opus-4.6":
			return "claude-opus-4.6";
		case "anthropic/claude-haiku-4.5":
			return "claude-haiku-4.5";
		case "anthropic/claude-opus-4.5":
			return "claude-opus-4.5";
		case "anthropic/claude-sonnet-4.5":
			return "claude-sonnet-4.5";
		case "google/gemini-2.5-flash":
			return "gemini-2.5-flash";
		case "google/gemini-2.5-flash-lite":
			return "gemini-2.5-flash-lite";
		case "google/gemini-3-pro-preview":
			return "gemini-3-pro-preview";
		case "google/gemini-3-flash":
			return "gemini-3-flash";
		case "google/gemini-2.5-pro":
			return "gemini-2.5-pro";
		case "openai/gpt-5.2":
			return "gpt-5.2";
		case "openai/gpt-5.2-codex":
			return "gpt-5.2-codex";
		case "openai/gpt-5.1-thinking":
			return "gpt-5.1-thinking";
		case "openai/gpt-5":
			return "gpt-5";
		case "openai/gpt-5-mini":
			return "gpt-5-mini";
		case "openai/gpt-5.1-codex":
			return "gpt-5.1-codex";
		case "openai/gpt-5-codex":
			return "gpt-5.1-codex";
		case "openai/gpt-5-nano":
			// When converting back, use gpt-5-nano (not sonar/sonar-pro)
			// as we cannot determine the original source
			return "gpt-5-nano";
		default: {
			const _exhaustiveCheck: never = from;
			throw new Error(`Unknown language model id: ${_exhaustiveCheck}`);
		}
	}
}

/**
 * Converts a TextGenerationNode to a ContentGenerationNode.
 * Preserves prompt, language model, and tools configuration.
 */
export function convertTextGenerationToContentGeneration(
	node: TextGenerationNode,
): ContentGenerationNode {
	const { content: textGenerationContent } = node;

	const languageModelId =
		convertTextGenerationLanguageModelIdToContentGenerationLanguageModelId(
			textGenerationContent.llm.id as TextGenerationModelIdWithLegacy,
		);
	// Convert language model from old format to new format
	const languageModelEntry = getEntry(languageModelId);

	const languageModel = {
		provider: languageModelEntry.providerId,
		id: languageModelEntry.id,
		configuration: languageModelEntry.defaultConfiguration,
	};

	// Convert tools from old format to new format
	const tools: ContentGenerationNode["content"]["tools"] = [];

	if (
		textGenerationContent.tools?.github &&
		textGenerationContent.tools.github.auth.type === "secret"
	) {
		tools.push({
			name: "github-api",
			configuration: {
				secretId: textGenerationContent.tools.github.auth.secretId,
				useTools: textGenerationContent.tools.github.tools,
			},
		});
	}

	if (textGenerationContent.tools?.postgres) {
		tools.push({
			name: "postgres",
			configuration: {
				secretId: textGenerationContent.tools.postgres.secretId,
				useTools: textGenerationContent.tools.postgres.tools,
			},
		});
	}

	if (textGenerationContent.tools?.openaiWebSearch) {
		tools.push({
			name: "openai-web-search",
			configuration: {},
		});
	}

	if (textGenerationContent.tools?.anthropicWebSearch) {
		tools.push({
			name: "anthropic-web-search",
			configuration: {
				maxUses: textGenerationContent.tools.anthropicWebSearch.maxUses,
				allowedDomains:
					textGenerationContent.tools.anthropicWebSearch.allowedDomains,
				blockedDomains:
					textGenerationContent.tools.anthropicWebSearch.blockedDomains,
			},
		});
	}

	return {
		...node,
		content: {
			type: "contentGeneration",
			version: "v1",
			languageModel,
			tools,
			prompt: textGenerationContent.prompt ?? "",
		},
	};
}

/**
 * Converts a ContentGenerationNode to a TextGenerationNode.
 * Preserves prompt, language model, and tools configuration.
 */
export function convertContentGenerationToTextGeneration(
	node: ContentGenerationNode,
): TextGenerationNode {
	const { content: contentGenerationContent } = node;

	// Convert language model from new format to old format
	const languageModelId =
		convertContentGenerationLanguageModelIdToTextGenerationLanguageModelId(
			contentGenerationContent.languageModel.id,
		);
	const languageModelEntry = getEntry(
		contentGenerationContent.languageModel.id,
	);
	let llm: TextGenerationNode["content"]["llm"] | undefined;

	switch (languageModelEntry.providerId) {
		case "anthropic":
			llm = {
				provider: "anthropic",
				id: AnthropicLanguageModelId.parse(languageModelId),
				configurations: {
					temperature: 0.7,
					topP: 1.0,
					reasoningText: false,
				},
			};
			break;
		case "google":
			llm = {
				provider: "google",
				id: GoogleLanguageModelId.parse(languageModelId),
				configurations: {
					temperature: 0.7,
					topP: 1.0,
					searchGrounding: false,
					urlContext: false,
				},
			};
			break;
		case "openai":
			llm = {
				provider: "openai",
				id: OpenAILanguageModelId.parse(languageModelId),
				configurations: {
					temperature: 0.7,
					topP: 1.0,
					presencePenalty: 0.0,
					frequencyPenalty: 0.0,
					textVerbosity: "medium",
					reasoningEffort: "medium",
				},
			};
			break;
		default: {
			const _exhaustiveCheck: never = languageModelEntry;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
	// Convert tools from new format to old format
	const tools: TextGenerationNode["content"]["tools"] = {};

	for (const tool of contentGenerationContent.tools) {
		switch (tool.name) {
			case "github-api": {
				const unsafeSecretId = tool.configuration.secretId;
				const result = SecretId.safeParse(unsafeSecretId);
				if (result.error) {
					continue;
				}

				const useTools = tool.configuration.useTools;
				if (!Array.isArray(useTools)) {
					continue;
				}
				tools.github = {
					tools: useTools,
					auth: {
						type: "secret",
						secretId: result.data,
					},
				};
				break;
			}
			case "postgres": {
				const unsafeSecretId = tool.configuration.secretId;
				const result = SecretId.safeParse(unsafeSecretId);
				if (result.error) {
					continue;
				}

				const useTools = tool.configuration.useTools;
				if (!Array.isArray(useTools)) {
					continue;
				}
				tools.postgres = {
					secretId: result.data,
					tools: useTools,
				};
				break;
			}
			case "openai-web-search": {
				tools.openaiWebSearch = {
					searchContextSize: "medium",
					userLocation: undefined,
				};
				break;
			}
			case "anthropic-web-search": {
				tools.anthropicWebSearch = {
					maxUses: tool.configuration.maxUses as number,
					allowedDomains: tool.configuration.allowedDomains as
						| string[]
						| undefined,
					blockedDomains: tool.configuration.blockedDomains as
						| string[]
						| undefined,
				};
				break;
			}
		}
	}

	// Only include tools if at least one tool is configured
	const toolsToInclude = Object.keys(tools).length > 0 ? tools : undefined;

	return {
		...node,
		content: {
			type: "textGeneration",
			llm,
			prompt: contentGenerationContent.prompt,
			tools: toolsToInclude,
		},
	};
}
