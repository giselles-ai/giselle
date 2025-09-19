import { type AnthropicProviderOptions, anthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import { googleTools } from "@ai-sdk/google/internal";
import { vertex } from "@ai-sdk/google-vertex/edge";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
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
import type { LanguageModel } from "ai";
import { AISDKError, streamText } from "ai";
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
	useAiGateway: boolean;
	useResumableGeneration: boolean;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		useExperimentalStorage: args.useExperimentalStorage,
		useResumableGeneration: args.useResumableGeneration,
		execute: async ({
			completeGeneration,
			runningGeneration,
			generationContext,
			setGeneration,
			fileResolver,
			generationContentResolver,
			imageGenerationResolver,
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
				imageGenerationResolver,
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
						google_search: googleTools.googleSearch({}),
					},
				};
			}

			if (
				operationNode.content.llm.provider === "anthropic" &&
				operationNode.content.tools?.anthropicWebSearch
			) {
				preparedToolSet = {
					...preparedToolSet,
					toolSet: {
						...preparedToolSet.toolSet,
						web_search: anthropic.tools.webSearch_20250305(
							operationNode.content.tools.anthropicWebSearch,
						),
					},
				};
			}

			const providerOptions = getProviderOptions(operationNode.content.llm);

			const model = generationModel(
				operationNode.content.llm,
				args.useAiGateway,
				args.context.aiGateway,
			);
			let generationError: unknown | undefined;
			const textGenerationStartTime = Date.now();
			const streamTextResult = streamText({
				model,
				providerOptions,
				messages,
				tools: preparedToolSet.toolSet,
				onError: ({ error }) => {
					generationError = error;
				},
				onFinish: () => {
					args.context.logger.info(
						`Text generation completed in ${Date.now() - textGenerationStartTime}ms`,
					);
				},
			});
			return streamTextResult.toUIMessageStream({
				sendReasoning: true,
				onFinish: async ({ messages: generateMessages }) => {
					args.context.logger.info(
						`Text generation stream completed in ${Date.now() - textGenerationStartTime}ms`,
					);
					const toolCleanupStartTime = Date.now();
					await Promise.all(
						preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
							cleanupFunction(),
						),
					);
					args.context.logger.info(
						`Tool cleanup completed in ${Date.now() - toolCleanupStartTime}ms`,
					);
					if (generationError) {
						if (AISDKError.isInstance(generationError)) {
							args.context.logger.error(
								generationError,
								`${args.generation.id} is failed`,
							);
						}
						const errInfo = AISDKError.isInstance(generationError)
							? { name: generationError.name, message: generationError.message }
							: {
									name: "UnknownError",
									message:
										generationError instanceof Error
											? generationError.message
											: String(generationError),
								};

						const failedGeneration = {
							...runningGeneration,
							status: "failed",
							failedAt: Date.now(),
							error: errInfo,
						} satisfies FailedGeneration;

						await Promise.all([
							setGeneration(failedGeneration),
							args.context.callbacks?.generationFailed?.({
								generation: failedGeneration,
								inputMessages: messages,
							}),
						]);
						return;
					}
					const generationOutputs: GenerationOutput[] = [];
					const generatedTextOutput =
						generationContext.operationNode.outputs.find(
							(output: Output) => output.accessor === "generated-text",
						);
					const textRetrievalStartTime = Date.now();
					const text = await streamTextResult.text;
					args.context.logger.info(
						`Text retrieval completed in ${Date.now() - textRetrievalStartTime}ms`,
					);
					if (generatedTextOutput !== undefined) {
						generationOutputs.push({
							type: "generated-text",
							content: text,
							outputId: generatedTextOutput.id,
						});
					}

					const reasoningRetrievalStartTime = Date.now();
					const reasoningText = await streamTextResult.reasoningText;
					args.context.logger.info(
						`Reasoning retrieval completed in ${Date.now() - reasoningRetrievalStartTime}ms`,
					);
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

					const sourceRetrievalStartTime = Date.now();
					const sources = await streamTextResult.sources;
					args.context.logger.info(
						`Source retrieval completed in ${Date.now() - sourceRetrievalStartTime}ms`,
					);
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
					const generationCompletionStartTime = Date.now();
					await completeGeneration({
						inputMessages: messages,
						outputs: generationOutputs,
						usage: await streamTextResult.usage,
						generateMessages: generateMessages,
						providerMetadata: await streamTextResult.providerMetadata,
					});
					args.context.logger.info(
						`Generation completion processing finished in ${Date.now() - generationCompletionStartTime}ms`,
					);
				},
			});
		},
	});
}

function generationModel(
	languageModel: TextGenerationLanguageModelData,
	useAiGateway: boolean,
	gatewayOptions?: { httpReferer: string; xTitle: string },
) {
	const llmProvider = languageModel.provider;
	if (useAiGateway) {
		const gateway = createGateway(
			gatewayOptions === undefined
				? undefined
				: {
						headers: {
							"http-referer": gatewayOptions.httpReferer,
							"x-title": gatewayOptions.xTitle,
						},
					},
		);
		// Use AI Gateway model specifier: "<provider>/<modelId>"
		// e.g. "openai/gpt-4o" or "anthropic/claude-3-5-sonnet-20240620"
		switch (llmProvider) {
			case "anthropic":
			case "openai":
			case "google":
			case "perplexity": {
				return gateway(`${llmProvider}/${languageModel.id}`);
			}
			default: {
				const _exhaustiveCheck: never = llmProvider;
				throw new Error(`Unknown LLM provider: ${_exhaustiveCheck}`);
			}
		}
	}

	// Default: use direct provider SDKs
	switch (llmProvider) {
		case "anthropic": {
			return anthropic(languageModel.id);
		}
		case "openai": {
			return openai.responses(languageModel.id);
		}
		case "google": {
			return vertex(languageModel.id) as LanguageModel;
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
			openai?: OpenAIResponsesProviderOptions;
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
	if (languageModel && languageModelData.provider === "openai") {
		const openaiOptions: OpenAIResponsesProviderOptions = {};
		if (hasCapability(languageModel, Capability.Reasoning)) {
			openaiOptions.textVerbosity =
				languageModelData.configurations.textVerbosity;
			openaiOptions.reasoningSummary = "auto";
			openaiOptions.reasoningEffort =
				languageModelData.configurations.reasoningEffort;
		}

		return { openai: openaiOptions };
	}
	return undefined;
}
