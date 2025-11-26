import { type AnthropicProviderOptions, anthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import type { SharedV2ProviderMetadata } from "@ai-sdk/provider";
import { githubTools, octokit } from "@giselles-ai/github-tool";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselles-ai/language-model";
import {
	getEntry,
	getLanguageModelTool,
} from "@giselles-ai/language-model-registry";
import type { GiselleLogger } from "@giselles-ai/logger";
import type {
	CompletedGeneration,
	FailedGeneration,
	GenerationOutput,
	GenerationUsage,
	OutputFileBlob,
	RunningGeneration,
} from "@giselles-ai/protocol";
import {
	isContentGenerationNode,
	isTextGenerationNode,
	type Output,
	SecretId,
	type TextGenerationLanguageModelData,
} from "@giselles-ai/protocol";
import {
	AISDKError,
	type AsyncIterableStream,
	type ModelMessage,
	smoothStream,
	stepCountIs,
	streamText,
	type ToolSet,
	type UIMessage,
} from "ai";
import z from "zod/v4";
import { generationUiMessageChunksPath } from "../path";
import { decryptSecret } from "../secrets";
import type { AiGatewayHeaders, GiselleContext } from "../types";
import { batchWriter } from "../utils";
import {
	type OnGenerationComplete,
	type OnGenerationError,
	useGenerationExecutor,
} from "./internal/use-generation-executor";
import { createPostgresTools } from "./tools/postgres";
import type { GenerationMetadata, PreparedToolSet } from "./types";
import { buildMessageObject, getGeneration } from "./utils";
import {
	createGitHubTools,
	createPostgresTool as createPostgresToolV2,
} from "./v2/tools";

type StreamItem<T> = T extends AsyncIterableStream<infer Inner> ? Inner : never;

type GenerateContentResult =
	| {
			success: true;
			completedGeneration: CompletedGeneration;
			inputMessages: ModelMessage[];
			outputFileBlobs: OutputFileBlob[];
			usage: GenerationUsage;
			generateMessages: UIMessage[];
			providerMetadata?: SharedV2ProviderMetadata;
	  }
	| {
			success: false;
			failedGeneration: FailedGeneration;
			inputMessages: ModelMessage[];
	  };

export function generateContent({
	context,
	generation,
	logger: overrideLogger,
	metadata,
	onComplete,
	onError,
}: {
	context: GiselleContext;
	generation: RunningGeneration;
	logger?: GiselleLogger;
	metadata?: GenerationMetadata;
	onComplete?: OnGenerationComplete;
	onError?: OnGenerationError;
}) {
	const logger = overrideLogger ?? context.logger;

	logger.info(`generate content: ${generation.id}`);
	logger.info(`generation metadata: ${JSON.stringify(metadata)}`);

	if (isContentGenerationNode(generation.context.operationNode)) {
		return generateContentV2({
			context,
			generation,
			logger: overrideLogger,
			metadata,
			onComplete,
			onError,
		});
	}
	// biome-ignore lint/correctness/useHookAtTopLevel: it's nodejs use
	return useGenerationExecutor({
		context,
		generation,
		metadata,
		onError,
		execute: async ({
			finishGeneration,
			runningGeneration,
			generationContext,
			setGeneration,
			fileResolver,
			generationContentResolver,
			imageGenerationResolver,
			appEntryResolver,
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

			const messages = await buildMessageObject({
				node: operationNode,
				contextNodes: generationContext.sourceNodes,
				fileResolver,
				generationContentResolver,
				imageGenerationResolver,
				appEntryResolver,
			});

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
				operationNode.content.llm.provider === "google" &&
				hasCapability(languageModel, Capability.UrlContext) &&
				(operationNode.content.llm.configurations.urlContext ?? false)
			) {
				preparedToolSet = {
					...preparedToolSet,
					toolSet: {
						...preparedToolSet.toolSet,
						url_context: google.tools.urlContext({}),
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

			const aiGatewayHeaders = await context.callbacks?.buildAiGatewayHeaders?.(
				{
					generation: runningGeneration,
					metadata,
				},
			);

			const model = generationModel(
				operationNode.content.llm,
				aiGatewayHeaders,
			);
			let generationError: unknown | undefined;
			const textGenerationStartTime = Date.now();

			const abortController = new AbortController();

			const streamTextResult = streamText({
				abortSignal: abortController.signal,
				model,
				providerOptions,
				messages,
				tools: preparedToolSet.toolSet,
				stopWhen: stepCountIs(Object.keys(preparedToolSet.toolSet).length + 1),
				onChunk: async () => {
					const currentGeneration = await getGeneration({
						storage: context.storage,
						generationId: generation.id,
					});
					if (currentGeneration?.status === "cancelled") {
						logger.debug(`${generation.id} will abort`);
						abortController.abort();
					}
				},
				onAbort: () => {
					logger.debug({ generationId: generation.id }, "streamText onAbort");
				},
				onError: ({ error }) => {
					generationError = error;
				},
				onFinish: () => {
					logger.info(
						`Text generation completed in ${Date.now() - textGenerationStartTime}ms`,
					);
				},
				experimental_transform: smoothStream({
					delayInMs: 1000,
					chunking: "line",
				}),
			});
			let uiMessageStreamResult: GenerateContentResult | undefined;
			const uiMessageStream = streamTextResult.toUIMessageStream({
				onFinish: async ({ messages: generateMessages }) => {
					logger.info(
						`Text generation stream completed in ${Date.now() - textGenerationStartTime}ms`,
					);
					const toolCleanupStartTime = Date.now();
					await Promise.all(
						preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
							cleanupFunction(),
						),
					);
					logger.info(
						`Tool cleanup completed in ${Date.now() - toolCleanupStartTime}ms`,
					);
					if (generationError) {
						if (AISDKError.isInstance(generationError)) {
							logger.error(generationError, `${generation.id} is failed`);
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
							onError?.({
								generation: failedGeneration,
								inputMessages: messages,
							}),
						]);
						uiMessageStreamResult = {
							success: false,
							failedGeneration,
							inputMessages: messages,
						};
					}
					const generationOutputs: GenerationOutput[] = [];
					const generatedTextOutput =
						generationContext.operationNode.outputs.find(
							(output: Output) => output.accessor === "generated-text",
						);
					const textRetrievalStartTime = Date.now();
					const text = await streamTextResult.text;
					logger.info(
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
					logger.info(
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
					logger.info(
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
					const result = await finishGeneration({
						inputMessages: messages,
						outputs: generationOutputs,
						usage: await streamTextResult.usage,
						generateMessages: generateMessages,
						providerMetadata: await streamTextResult.providerMetadata,
						onComplete,
					});
					logger.info(
						`Generation completion processing finished in ${Date.now() - generationCompletionStartTime}ms`,
					);

					uiMessageStreamResult = {
						success: true,
						completedGeneration: result.completedGeneration,
						inputMessages: messages,
						outputFileBlobs: result.outputFileBlobs,
						usage: await streamTextResult.usage,
						generateMessages: generateMessages,
						providerMetadata: await streamTextResult.providerMetadata,
					};
				},
			});

			const writer = batchWriter<StreamItem<typeof uiMessageStream>>({
				process: (batch) => {
					logger.debug(`Processing batch with ${batch.length} items`);
					return context.storage.setBlob(
						generationUiMessageChunksPath(generation.id),
						new TextEncoder().encode(
							batch.map((chunk) => JSON.stringify(chunk)).join("\n"),
						),
					);
				},
				preserveItems: true,
				logger,
			});

			let chunkCount = 0;
			const uiMessageChunks: StreamItem<typeof uiMessageStream>[] = [];
			for await (const chunk of uiMessageStream) {
				chunkCount++;
				logger.debug(`Adding chunk ${chunkCount}: ${chunk.type}`);
				writer.add(chunk);
				uiMessageChunks.push(chunk);
			}
			logger.debug(`Stream ended, total chunks: ${chunkCount}`);
			await writer.close();
			logger.debug(`Writer closed`);

			if (uiMessageStreamResult === undefined) {
				throw new Error("UI message stream result is undefined");
			}

			return uiMessageStreamResult;
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
	gatewayHeaders?: AiGatewayHeaders,
) {
	const llmProvider = languageModel.provider;
	const gateway = createGateway(
		gatewayHeaders === undefined
			? undefined
			: {
					headers: gatewayHeaders,
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

function generateContentV2({
	context,
	generation,
	logger: overrideLogger,
	metadata,
	onComplete,
	onError,
}: {
	context: GiselleContext;
	generation: RunningGeneration;
	logger?: GiselleLogger;
	metadata?: GenerationMetadata;
	onComplete?: OnGenerationComplete;
	onError?: OnGenerationError;
}) {
	const logger = overrideLogger ?? context.logger;
	// biome-ignore lint/correctness/useHookAtTopLevel: it's nodejs use
	return useGenerationExecutor({
		context,
		generation,
		metadata,
		onError,
		execute: async ({
			finishGeneration,
			runningGeneration,
			generationContext,
			setGeneration,
			fileResolver,
			generationContentResolver,
			imageGenerationResolver,
			appEntryResolver,
		}) => {
			const operationNode = generationContext.operationNode;
			if (!isContentGenerationNode(operationNode)) {
				throw new Error("Invalid generation type");
			}

			const languageModel = getEntry(operationNode.content.languageModel.id);
			const messages = await buildMessageObject({
				node: operationNode,
				contextNodes: generationContext.sourceNodes,
				fileResolver,
				generationContentResolver,
				imageGenerationResolver,
				appEntryResolver,
			});

			const toolSet: ToolSet = {};
			for (const tool of operationNode.content.tools) {
				const languageModelTool = getLanguageModelTool(tool.name);
				switch (languageModelTool.name) {
					case "anthropic-web-search":
						{
							const configurationOptionSchema = z.object({
								allowedDomains:
									languageModelTool.configurationOptions.allowedDomains.schema,
								blockedDomains:
									languageModelTool.configurationOptions.blockedDomains.schema,
								maxUses: languageModelTool.configurationOptions.maxUses.schema,
							});
							const result = configurationOptionSchema.safeParse(
								tool.configuration,
							);
							if (!result.success) {
								logger.warn(
									`${generation.id}, ${operationNode.id}, anthropic-web-search tool configuration is invalid: ${result.error.message}`,
								);
								continue;
							}
							const anthropicWebSearchConfiguration = result.data;
							toolSet.web_search = anthropic.tools.webSearch_20250305({
								maxUses: anthropicWebSearchConfiguration.maxUses,
								allowedDomains: anthropicWebSearchConfiguration.allowedDomains,
								blockedDomains: anthropicWebSearchConfiguration.blockedDomains,
							});
						}
						break;
					case "github-api": {
						const unsafeSecretId =
							tool.configuration[
								languageModelTool.configurationOptions.secretId.name
							];
						const result = SecretId.safeParse(unsafeSecretId);
						if (result.error) {
							logger.warn(
								`${generation.id}, ${operationNode.id}, github-api tool secret id is undefined`,
							);
							continue;
						}
						const unsafeToken = await decryptSecret({
							context,
							secretId: result.data,
						});
						if (unsafeToken === undefined) {
							logger.warn(
								`${generation.id}, ${operationNode.id}, github-api tool secret token is undefined`,
							);
							continue;
						}
						const token = unsafeToken;
						const useTools =
							tool.configuration[
								languageModelTool.configurationOptions.useTools.name
							];
						if (!Array.isArray(useTools)) {
							logger.warn(
								`${generation.id}, ${operationNode.id}, github-api tool use tools is not an array`,
							);
							continue;
						}

						const app = octokit({
							strategy: "personal-access-token",
							personalAccessToken: token,
						});

						const githubTools = createGitHubTools(
							app,
							languageModelTool.tools,
							useTools,
						);
						Object.assign(toolSet, githubTools);
						break;
					}
					case "google-web-search":
						toolSet.google_search = google.tools.googleSearch({});
						break;
					case "openai-web-search": {
						const configurationOptionSchema = z.object({
							allowedDomains:
								languageModelTool.configurationOptions.allowedDomains.schema,
						});
						const result = configurationOptionSchema.safeParse(
							tool.configuration,
						);
						if (!result.success) {
							logger.warn(
								`${generation.id}, ${operationNode.id}, anthropic-web-search tool configuration is invalid: ${result.error.message}`,
							);
							continue;
						}
						toolSet.web_search = openai.tools.webSearch(
							result.data.allowedDomains
								? { filters: { allowedDomains: result.data.allowedDomains } }
								: {},
						);
						break;
					}
					case "postgres": {
						const unsafeSecretId =
							tool.configuration[
								languageModelTool.configurationOptions.secretId.name
							];
						const result = SecretId.safeParse(unsafeSecretId);
						if (result.error) {
							logger.warn(
								`${generation.id}, ${operationNode.id}, github-api tool secret id is undefined`,
							);
							continue;
						}
						const unsafeToken = await decryptSecret({
							context,
							secretId: result.data,
						});
						if (unsafeToken === undefined) {
							logger.warn(
								`${generation.id}, ${operationNode.id}, github-api tool secret token is undefined`,
							);
							continue;
						}
						const connectionString = unsafeToken;
						const useTools =
							tool.configuration[
								languageModelTool.configurationOptions.useTools.name
							];
						if (!Array.isArray(useTools)) {
							logger.warn(
								`${generation.id}, ${operationNode.id}, github-api tool use tools is not an array`,
							);
							continue;
						}
						const postgresTools = createPostgresToolV2({
							connectionString,
							useTools,
							toolDefs: languageModelTool.tools,
							context,
						});

						Object.assign(toolSet, postgresTools);
						break;
					}
					default: {
						const _exhaustiveCheck: never = languageModelTool;
						throw new Error(`Unknown tool: ${_exhaustiveCheck}`);
					}
				}
			}
		},
	});
}
