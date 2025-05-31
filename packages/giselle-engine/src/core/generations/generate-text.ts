import { type AnthropicProviderOptions, anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { perplexity } from "@ai-sdk/perplexity";
import {
	type FailedGeneration,
	type GenerationOutput,
	type QueuedGeneration,
	type TextGenerationLanguageModelData,
	type UrlSource,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import { githubTools, octokit } from "@giselle-sdk/github-tool";
import {
	Capability,
	calculateDisplayCost,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { AISDKError, appendResponseMessages, streamText } from "ai";
import type { GiselleEngineContext } from "../types";
import { useGenerationExecutor } from "./internal/use-generation-executor";
import { createLangfuseTracer, generateTelemetryTags } from "./telemetry";
import { createPostgresTools } from "./tools/postgres";
import type { PreparedToolSet, TelemetrySettings } from "./types";
import { buildMessageObject } from "./utils";

// PerplexityProviderOptions is not exported from @ai-sdk/perplexity, so we define it here based on the model configuration
export type PerplexityProviderOptions = {
	search_domain_filter?: string[];
};

export async function generateText(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	telemetry?: TelemetrySettings;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		execute: async ({
			runningGeneration,
			generationContext,
			setGeneration,
			fileResolver,
			generationContentResolver,
			workspaceId,
			completeGeneration,
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
				runningGeneration.context.sourceNodes,
				fileResolver,
				generationContentResolver,
			);

			let preparedToolSet: PreparedToolSet = {
				toolSet: {},
				cleanupFunctions: [],
			};

			if (operationNode.content.tools?.github?.auth) {
				const decryptToken = await args.context.vault?.decrypt(
					operationNode.content.tools.github.auth.token,
				);
				const allGitHubTools = githubTools(
					octokit({
						strategy: "personal-access-token",
						personalAccessToken:
							decryptToken ?? operationNode.content.tools.github.auth.token,
					}),
				);
				for (const tool of operationNode.content.tools.github.tools) {
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

			if (operationNode.content.tools?.postgres?.connectionString) {
				const connectionString = await args.context.vault?.decrypt(
					operationNode.content.tools.postgres.connectionString,
				);
				const postgresTool = createPostgresTools(
					connectionString ??
						operationNode.content.tools.postgres.connectionString,
				);
				for (const tool of operationNode.content.tools.postgres.tools) {
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
						openaiWebSearch: openai.tools.webSearchPreview(
							operationNode.content.tools.openaiWebSearch,
						),
					},
				};
			}

			const providerOptions = getProviderOptions(operationNode.content.llm);

			const streamTextResult = streamText({
				model: generationModel(operationNode.content.llm),
				providerOptions,
				messages,
				maxSteps: 5, // enable multi-step calls
				tools: preparedToolSet.toolSet,
				experimental_continueSteps: true,
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
				async onFinish(event) {
					const generationOutputs: GenerationOutput[] = [];
					const generatedTextOutput =
						generationContext.operationNode.outputs.find(
							(output) => output.accessor === "generated-text",
						);
					if (generatedTextOutput !== undefined) {
						generationOutputs.push({
							type: "generated-text",
							content: event.text,
							outputId: generatedTextOutput.id,
						});
					}

					const tokenUsage = event.usage;
					let costInfo = null;

					if (tokenUsage) {
						costInfo = await calculateDisplayCost(
							operationNode.content.llm.provider,
							operationNode.content.llm.id,
							tokenUsage,
						);
					}

					const reasoningOutput = generationContext.operationNode.outputs.find(
						(output) => output.accessor === "reasoning",
					);
					if (reasoningOutput !== undefined && event.reasoning !== undefined) {
						generationOutputs.push({
							type: "reasoning",
							content: event.reasoning,
							outputId: reasoningOutput.id,
						});
					}
					const sourceOutput = generationContext.operationNode.outputs.find(
						(output) => output.accessor === "source",
					);
					if (sourceOutput !== undefined && event.sources.length > 0) {
						const sources = await Promise.all(
							event.sources.map(async (source) => {
								return {
									sourceType: "url",
									id: source.id,
									url: source.url,
									title: source.title ?? source.url,
									providerMetadata: source.providerMetadata,
								} satisfies UrlSource;
							}),
						);
						generationOutputs.push({
							type: "source",
							outputId: sourceOutput.id,
							sources,
						});
					}
					const completedGeneration = await completeGeneration({
						outputs: generationOutputs,
						usage: tokenUsage,
						messages: appendResponseMessages({
							messages: [
								{
									id: "id",
									role: "user",
									content: "",
								},
							],
							responseMessages: event.response.messages,
						}),
					});

					// necessary to send telemetry but not explicitly used
					const langfuse = createLangfuseTracer({
						workspaceId,
						runningGeneration,
						tags: generateTelemetryTags({
							provider: operationNode.content.llm.provider,
							languageModel,
							toolSet: preparedToolSet.toolSet,
							configurations: operationNode.content.llm.configurations,
							providerOptions,
						}),
						messages: { messages },
						output: event.text,
						usage: {
							input: tokenUsage?.promptTokens ?? 0,
							output: tokenUsage?.completionTokens ?? 0,
							total:
								(tokenUsage?.promptTokens ?? 0) +
								(tokenUsage?.completionTokens ?? 0),
							inputCost: costInfo?.inputCostForDisplay ?? 0,
							outputCost: costInfo?.outputCostForDisplay ?? 0,
							totalCost: costInfo?.totalCostForDisplay ?? 0,
							unit: "TOKENS",
						},
						completedGeneration,
						spanName: "ai.streamText",
						generationName: "ai.streamText.doStream",
						settings: args.telemetry,
					});
					try {
						await Promise.all([
							langfuse.shutdownAsync(),
							...preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
								cleanupFunction(),
							),
						]);
					} catch (error) {
						console.error("Cleanup process failed:", error);
					}
				},
				experimental_telemetry: {
					isEnabled: args.context.telemetry?.isEnabled,
					metadata: {
						...args.telemetry?.metadata,
						tags: [
							"auto-instrumented",
							...generateTelemetryTags({
								provider: operationNode.content.llm.provider,
								languageModel,
								toolSet: preparedToolSet.toolSet,
								configurations: operationNode.content.llm.configurations,
								providerOptions:
									operationNode.content.llm.provider === "anthropic"
										? providerOptions
										: undefined,
							}),
						],
					},
				},
			});
			return streamTextResult;
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
			return google(languageModel.id, {
				useSearchGrounding: languageModel.configurations.searchGrounding,
			});
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
		languageModelData.configurations.reasoning &&
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
