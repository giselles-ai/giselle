import { getEntry } from "@giselles-ai/language-model-registry";
import type {
	ContentGenerationNode,
	TextGenerationNode,
} from "@giselles-ai/protocol";

/**
 * Converts a TextGenerationNode to a ContentGenerationNode.
 * Preserves prompt, language model, and tools configuration.
 */
export function convertTextGenerationToContentGeneration(
	node: TextGenerationNode,
): ContentGenerationNode {
	const { content } = node;

	// Convert language model from old format to new format
	const languageModelEntry = getEntry(content.llm.id);
	const languageModel = {
		provider: languageModelEntry.provider,
		id: languageModelEntry.id,
		configuration: content.llm.configurations ?? {},
	};

	// Convert tools from old format to new format
	const tools: ContentGenerationNode["content"]["tools"] = [];

	if (content.tools?.github) {
		tools.push({
			name: "github",
			configuration: {
				tools: content.tools.github.tools,
				auth: content.tools.github.auth,
			},
		});
	}

	if (content.tools?.postgres) {
		tools.push({
			name: "postgres",
			configuration: {
				secretId: content.tools.postgres.secretId,
				useTools: content.tools.postgres.tools,
			},
		});
	}

	if (content.tools?.openaiWebSearch) {
		tools.push({
			name: "openai-web-search",
			configuration: {
				searchContextSize:
					content.tools.openaiWebSearch.searchContextSize ?? "medium",
				userLocation: content.tools.openaiWebSearch.userLocation,
			},
		});
	}

	if (content.tools?.anthropicWebSearch) {
		tools.push({
			name: "anthropic-web-search",
			configuration: {
				maxUses: content.tools.anthropicWebSearch.maxUses,
				allowedDomains: content.tools.anthropicWebSearch.allowedDomains,
				blockedDomains: content.tools.anthropicWebSearch.blockedDomains,
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
			prompt: content.prompt ?? "",
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
	const { content } = node;

	// Convert language model from new format to old format
	const languageModelEntry = getEntry(content.languageModel.id);
	const llm = {
		provider: languageModelEntry.provider,
		id: languageModelEntry.id,
		configurations: content.languageModel.configuration,
	};

	// Convert tools from new format to old format
	const tools: TextGenerationNode["content"]["tools"] = {};

	for (const tool of content.tools) {
		switch (tool.name) {
			case "github": {
				tools.github = {
					tools: (tool.configuration.tools as string[]) ?? [],
					auth: tool.configuration.auth as
						| { type: "pat"; token: string; userId?: string }
						| { type: "secret"; secretId: string; userId?: string },
				};
				break;
			}
			case "postgres": {
				tools.postgres = {
					secretId: tool.configuration.secretId as string,
					tools: (tool.configuration.useTools as string[]) ?? [],
				};
				break;
			}
			case "openai-web-search": {
				tools.openaiWebSearch = {
					searchContextSize:
						(tool.configuration.searchContextSize as
							| "low"
							| "medium"
							| "high") ?? "medium",
					userLocation: tool.configuration.userLocation as
						| {
								type: "approximate";
								country?: string;
								city?: string;
								region?: string;
								timezone?: string;
						  }
						| undefined,
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
	const toolsToInclude =
		Object.keys(tools).length > 0 ? tools : undefined;

	return {
		...node,
		content: {
			type: "textGeneration",
			llm,
			prompt: content.prompt,
			tools: toolsToInclude,
		},
	};
}
