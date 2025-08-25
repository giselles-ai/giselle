import { type AnthropicProviderOptions, anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { perplexity } from "@ai-sdk/perplexity";
import {
	isTextGenerationNode,
	type Output,
	type TextGenerationLanguageModelData,
} from "@giselle-sdk/data-type";
import { githubTools, octokit } from "@giselle-sdk/github-tool";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { AISDKError, stepCountIs, streamText } from "ai";
import type {
	FailedGeneration,
	GenerationOutput,
	QueuedGeneration,
} from "../../concepts/generation";
import { decryptSecret } from "../secrets";
import type { GiselleEngineContext } from "../types";
import { useGenerationExecutor } from "./internal/use-generation-executor";
import { createPostgresTools } from "./tools/postgres";
import type { PreparedToolSet } from "./types";
import { buildMessageObject } from "./utils";

// PerplexityProviderOptions is not exported from @ai-sdk/perplexity, so we define it here based on the model configuration
type PerplexityProviderOptions = {
	search_domain_filter?: string[];
};

export function generateText(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	useExperimentalStorage: boolean;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		useExperimentalStorage: args.useExperimentalStorage,
		execute: async ({
			completeGeneration,
			runningGeneration,
			generationContext,
			setGeneration,
			fileResolver,
			generationContentResolver,
		}) => {
			const operationNode = generationContext.operationNode;
			if (!isTextGenerationNode(operationNode)) {
				throw new Error("Invalid generation type");
			}

			const languageModel = languageModels.find(
				(lm) => lm.id === operationNode.content.llm.id,
			);
			if (!languageModel) {
				throw new Error("Invalid language model");
			}

			const messages = await buildMessageObject(
				operationNode,
				generationContext.sourceNodes,
				fileResolver,
				generationContentResolver,
			);

			let preparedToolSet: PreparedToolSet = {
				toolSet: {},
				cleanupFunctions: [],
			};

			const githubTool = operationNode.content.tools?.github;
			if (githubTool) {
				let decryptToken: string | undefined;
				switch (githubTool.auth.type) {
					case "pat":
						decryptToken = await args.context.vault?.decrypt(
							githubTool.auth.token,
						);
						break;
					case "secret":
						decryptToken = await decryptSecret({
							...args,
							secretId: githubTool.auth.secretId,
						});
						break;
					default: {
						const _exhaustiveCheck: never = githubTool.auth;
						throw new Error(`Unhandled auth type: ${_exhaustiveCheck}`);
					}
				}
				const allGitHubTools = githubTools(
					octokit({
						strategy: "personal-access-token",
						personalAccessToken: decryptToken ?? "token",
					}),
				);
				for (const tool of githubTool.tools) {
					if (tool in allGitHubTools) {
						preparedToolSet = {
							...preparedToolSet,
							toolSet: {
								...preparedToolSet.toolSet,
								[tool]: allGitHubTools[tool as keyof typeof allGitHubTools],
							},
						};
					}
				}
			}

			const postgresToolData = operationNode.content.tools?.postgres;
			if (postgresToolData?.secretId) {
				const connectionString = await decryptSecret({
					...args,
					secretId: postgresToolData.secretId,
				});
				if (connectionString === undefined) {
					throw new Error("Failed to decrypt secret");
				}

				const postgresTool = createPostgresTools(connectionString);
				for (const tool of postgresToolData.tools) {
					if (tool in postgresTool.toolSet) {
						preparedToolSet = {
							...preparedToolSet,
							toolSet: {
								...preparedToolSet.toolSet,
								[tool]:
									postgresTool.toolSet[
										tool as keyof typeof postgresTool.toolSet
									],
							},
						};
					}
					preparedToolSet = {
						...preparedToolSet,
						cleanupFunctions: [
							...preparedToolSet.cleanupFunctions,
							postgresTool.cleanup,
						],
					};
				}
			}

			if (
				operationNode.content.llm.provider === "openai" &&
				operationNode.content.tools?.openaiWebSearch &&
				hasCapability(languageModel, Capability.OptionalSearchGrounding)
			) {
				preparedToolSet = {
					...preparedToolSet,
					toolSet: {
						...preparedToolSet.toolSet,
						web_search_preview: openai.tools.webSearchPreview(
							operationNode.content.tools.openaiWebSearch,
						),
					},
				};
			}
			if (
				operationNode.content.llm.provider === "google" &&
				operationNode.content.llm.configurations.searchGrounding &&
				hasCapability(languageModel, Capability.OptionalSearchGrounding)
			) {
				preparedToolSet = {
					...preparedToolSet,
					toolSet: {
						...preparedToolSet.toolSet,
						googleWebSearch: google.tools.googleSearch({}),
					},
				};
			}

			const providerOptions = getProviderOptions(operationNode.content.llm);

			const streamTextResult = streamText({
				model: generationModel(operationNode.content.llm),
				providerOptions,
				messages,
				tools: preparedToolSet.toolSet,
				onError: async ({ error }) => {
					if (AISDKError.isInstance(error)) {
						const failedGeneration = {
							...runningGeneration,
							status: "failed",
							failedAt: Date.now(),
							error: {
								name: error.name,
								message: error.message,
							},
						} satisfies FailedGeneration;

						await setGeneration(failedGeneration);
					}

					await Promise.all(
						preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
							cleanupFunction(),
						),
					);
				},
				stopWhen: stepCountIs(Object.keys(preparedToolSet.toolSet).length + 1),
				async onFinish() {
					try {
						await Promise.all(
							preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
								cleanupFunction(),
							),
						);
					} catch (error) {
						console.error("Cleanup process failed:", error);
					}
				},
			});
			return streamTextResult.toUIMessageStream({
				sendReasoning: true,
				onFinish: async ({ messages: generateMessages }) => {
					const generationOutputs: GenerationOutput[] = [];
					const generatedTextOutput =
						generationContext.operationNode.outputs.find(
							(output: Output) => output.accessor === "generated-text",
						);
					const text = await streamTextResult.text;
					if (generatedTextOutput !== undefined) {
						generationOutputs.push({
							type: "generated-text",
							content: text,
							outputId: generatedTextOutput.id,
						});
					}

					const reasoningText = await streamTextResult.reasoningText;
					const reasoningOutput = generationContext.operationNode.outputs.find(
						(output: Output) => output.accessor === "reasoning",
					);
					if (reasoningOutput !== undefined && reasoningText !== undefined) {
						generationOutputs.push({
							type: "reasoning",
							content: reasoningText,
							outputId: reasoningOutput.id,
						});
					}

					const sources = await streamTextResult.sources;
					const sourceOutput = generationContext.operationNode.outputs.find(
						(output: Output) => output.accessor === "source",
					);
					if (sourceOutput !== undefined && sources.length > 0) {
						generationOutputs.push({
							type: "source",
							outputId: sourceOutput.id,
							sources,
						});
					}
					await completeGeneration({
						inputMessages: messages,
						outputs: generationOutputs,
						usage: await streamTextResult.usage,
						generateMessages: generateMessages,
					});
				},
			});
		},
	});
}

function generationModel(languageModel: TextGenerationLanguageModelData) {
	const llmProvider = languageModel.provider;
	switch (llmProvider) {
		case "anthropic": {
			return anthropic(languageModel.id);
		}
		case "openai": {
			return openai.responses(languageModel.id);
		}
		case "google": {
			return google(languageModel.id);
		}
		case "perplexity": {
			return perplexity(languageModel.id);
		}
		default: {
			const _exhaustiveCheck: never = llmProvider;
			throw new Error(`Unknown LLM provider: ${_exhaustiveCheck}`);
		}
	}
}

function getProviderOptions(languageModelData: TextGenerationLanguageModelData):
	| {
			anthropic?: AnthropicProviderOptions;
			perplexity?: PerplexityProviderOptions;
	  }
	| undefined {
	const languageModel = languageModels.find(
		(model) => model.id === languageModelData.id,
	);
	if (
		languageModel &&
		languageModelData.provider === "anthropic" &&
		languageModelData.configurations.reasoningText &&
		hasCapability(languageModel, Capability.Reasoning)
	) {
		return {
			anthropic: {
				thinking: {
					type: "enabled",
					// Based on Zed's configuration: https://github.com/zed-industries/zed/blob/9d10489607df700c544c48cf09fea82f5d5aacf8/crates/anthropic/src/anthropic.rs#L212
					budgetTokens: 4096,
				},
			},
		};
	}
	if (
		languageModel &&
		languageModelData.provider === "perplexity" &&
		languageModelData.configurations.searchDomainFilter
	) {
		const { searchDomainFilter } = languageModelData.configurations;
		return {
			perplexity: {
				// https://docs.perplexity.ai/guides/search-domain-filters
				search_domain_filter: searchDomainFilter,
			},
		};
	}
	return undefined;
}
