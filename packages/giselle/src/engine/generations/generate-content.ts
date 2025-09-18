import { type AnthropicProviderOptions, anthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
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
import { AISDKError, type AsyncIterableStream, streamText } from "ai";
import type {
	FailedGeneration,
	GenerationOutput,
	QueuedGeneration,
} from "../../concepts/generation";
import { generationUiMessageChunksPath } from "../../concepts/path";
import { batchWriter } from "../../utils";
import { decryptSecret } from "../secrets";
import type { GiselleEngineContext } from "../types";
import { useGenerationExecutor } from "./internal/use-generation-executor";
import { createPostgresTools } from "./tools/postgres";
import type { PreparedToolSet } from "./types";
import { buildMessageObject } from "./utils";

type StreamItem<T> = T extends AsyncIterableStream<infer Inner> ? Inner : never;

export function generateContent({
	context,
	generation,
	abortSignal,
}: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	abortSignal?: AbortSignal;
}) {
	context.logger.info(`generate content: ${generation.id}`);
	return useGenerationExecutor({
		context,
		generation,
		useExperimentalStorage: true,
		useResumableGeneration: true,
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
						decryptToken = await context.vault?.decrypt(githubTool.auth.token);
						break;
					case "secret":
						decryptToken = await decryptSecret({
							context,
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
					context,
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
						web_search: openai.tools.webSearch(
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
						google_search: google.tools.googleSearch({}),
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
				context.aiGateway,
			);
			let generationError: unknown | undefined;
			const textGenerationStartTime = Date.now();

			context.waitUntil(async () => {
				const streamTextResult = streamText({
					abortSignal,
					model,
					providerOptions,
					messages,
					tools: preparedToolSet.toolSet,
					onError: ({ error }) => {
						generationError = error;
					},
					onFinish: () => {
						context.logger.info(
							`Text generation completed in ${Date.now() - textGenerationStartTime}ms`,
						);
					},
				});
				const uiMessageStream = streamTextResult.toUIMessageStream({
					onFinish: async ({ messages: generateMessages }) => {
						context.logger.info(
							`Text generation stream completed in ${Date.now() - textGenerationStartTime}ms`,
						);
						const toolCleanupStartTime = Date.now();
						await Promise.all(
							preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
								cleanupFunction(),
							),
						);
						context.logger.info(
							`Tool cleanup completed in ${Date.now() - toolCleanupStartTime}ms`,
						);
						if (generationError) {
							if (AISDKError.isInstance(generationError)) {
								context.logger.error(
									generationError,
									`${generation.id} is failed`,
								);
							}
							const errInfo = AISDKError.isInstance(generationError)
								? {
										name: generationError.name,
										message: generationError.message,
									}
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
								context.callbacks?.generationFailed?.({
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
						context.logger.info(
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
						context.logger.info(
							`Reasoning retrieval completed in ${Date.now() - reasoningRetrievalStartTime}ms`,
						);
						const reasoningOutput =
							generationContext.operationNode.outputs.find(
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
						context.logger.info(
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
						context.logger.info(
							`Generation completion processing finished in ${Date.now() - generationCompletionStartTime}ms`,
						);
					},
				});

				const writer = batchWriter<StreamItem<typeof uiMessageStream>>({
					process: (batch) =>
						context.experimental_storage.setBlob(
							generationUiMessageChunksPath(generation.id),
							new TextEncoder().encode(
								batch.map((chunk) => JSON.stringify(chunk)).join("\n"),
							),
						),
					preserveItems: true,
				});

				for await (const chunk of uiMessageStream) {
					writer.add(chunk);
				}
				await writer.close();
			});
			return runningGeneration;
		},
	});
}

function getProviderOptions(languageModelData: TextGenerationLanguageModelData):
	| {
			anthropic?: AnthropicProviderOptions;
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

function generationModel(
	languageModel: TextGenerationLanguageModelData,
	gatewayOptions?: { httpReferer: string; xTitle: string },
) {
	const llmProvider = languageModel.provider;
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
