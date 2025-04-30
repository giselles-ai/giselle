import { URL } from "node:url";
import { type AnthropicProviderOptions, anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { perplexity } from "@ai-sdk/perplexity";
import {
	type CompletedGeneration,
	type FailedGeneration,
	type FileData,
	GenerationContext,
	type GenerationOutput,
	type NodeId,
	type Output,
	type OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	type TextGenerationLanguageModelData,
	type UrlSource,
	isCompletedGeneration,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import { githubTools, octokit } from "@giselle-sdk/github-tool";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import {
	AISDKError,
	type ToolSet,
	appendResponseMessages,
	streamText,
} from "ai";
import { UsageLimitError } from "../error";
import { filePath } from "../files/utils";
import type { GiselleEngineContext } from "../types";
import { createPostgresTools } from "./tools/postgres";
import type { PreparedToolSet, TelemetrySettings } from "./types";
import {
	buildMessageObject,
	checkUsageLimits,
	extractWorkspaceIdFromOrigin,
	getGeneration,
	getNodeGenerationIndexes,
	getRedirectedUrlAndTitle,
	handleAgentTimeConsumption,
	setGeneration,
	setGenerationIndex,
	setNodeGenerationIndex,
} from "./utils";

export async function generateText(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	telemetry?: TelemetrySettings;
}) {
	const operationNode = args.generation.context.operationNode;
	if (!isTextGenerationNode(operationNode)) {
		throw new Error("Invalid generation type");
	}
	const languageModel = languageModels.find(
		(lm) => lm.id === operationNode.content.llm.id,
	);
	if (!languageModel) {
		throw new Error("Invalid language model");
	}
	const generationContext = GenerationContext.parse(args.generation.context);
	const runningGeneration = {
		...args.generation,
		status: "running",
		messages: [],
		startedAt: Date.now(),
	} satisfies RunningGeneration;

	await Promise.all([
		setGeneration({
			storage: args.context.storage,
			generation: runningGeneration,
		}),
		setGenerationIndex({
			storage: args.context.storage,
			generationIndex: {
				id: runningGeneration.id,
				origin: runningGeneration.context.origin,
			},
		}),
		setNodeGenerationIndex({
			storage: args.context.storage,
			nodeId: runningGeneration.context.operationNode.id,
			origin: runningGeneration.context.origin,
			nodeGenerationIndex: {
				id: runningGeneration.id,
				nodeId: runningGeneration.context.operationNode.id,
				status: "running",
				createdAt: runningGeneration.createdAt,
				queuedAt: runningGeneration.queuedAt,
				startedAt: runningGeneration.startedAt,
			},
		}),
	]);

	const workspaceId = await extractWorkspaceIdFromOrigin({
		storage: args.context.storage,
		origin: args.generation.context.origin,
	});

	const usageLimitStatus = await checkUsageLimits({
		workspaceId,
		generation: args.generation,
		fetchUsageLimitsFn: args.context.fetchUsageLimitsFn,
	});
	if (usageLimitStatus.type === "error") {
		const failedGeneration = {
			...runningGeneration,
			status: "failed",
			failedAt: Date.now(),
			error: {
				name: usageLimitStatus.error,
				message: usageLimitStatus.error,
				dump: usageLimitStatus,
			},
		} satisfies FailedGeneration;
		await Promise.all([
			setGeneration({
				storage: args.context.storage,
				generation: failedGeneration,
			}),
			setNodeGenerationIndex({
				storage: args.context.storage,
				nodeId: runningGeneration.context.operationNode.id,
				origin: runningGeneration.context.origin,
				nodeGenerationIndex: {
					id: failedGeneration.id,
					nodeId: failedGeneration.context.operationNode.id,
					status: "failed",
					createdAt: failedGeneration.createdAt,
					queuedAt: failedGeneration.queuedAt,
					startedAt: failedGeneration.startedAt,
					failedAt: failedGeneration.failedAt,
				},
			}),
		]);
		throw new UsageLimitError(usageLimitStatus.error);
	}

	async function fileResolver(file: FileData) {
		const blob = await args.context.storage.getItemRaw(
			filePath({
				...runningGeneration.context.origin,
				fileId: file.id,
			}),
		);
		if (blob === undefined) {
			return undefined;
		}
		return blob;
	}

	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			origin: runningGeneration.context.origin,
			storage: args.context.storage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			return undefined;
		}
		const generation = await getGeneration({
			...args,
			storage: args.context.storage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		});
		if (generation === undefined || !isCompletedGeneration(generation)) {
			return undefined;
		}
		let output: Output | undefined;
		for (const sourceNode of runningGeneration.context.sourceNodes) {
			for (const sourceOutput of sourceNode.outputs) {
				if (sourceOutput.id === outputId) {
					output = sourceOutput;
					break;
				}
			}
		}
		if (output === undefined) {
			return undefined;
		}
		const generationOutput = generation.outputs.find(
			(output) => output.outputId === outputId,
		);
		if (generationOutput === undefined) {
			return undefined;
		}
		switch (generationOutput.type) {
			case "source":
				return JSON.stringify(generationOutput.sources);
			case "reasoning":
				throw new Error("Generation output type is not supported");
			case "generated-image":
				throw new Error("Generation output type is not supported");
			case "generated-text":
				return generationOutput.content;
			default: {
				const _exhaustiveCheck: never = generationOutput;
				throw new Error(
					`Unhandled generation output type: ${_exhaustiveCheck}`,
				);
			}
		}
	}
	const messages = await buildMessageObject(
		operationNode,
		runningGeneration.context.sourceNodes,
		fileResolver,
		generationContentResolver,
	);

	let preparedToolSet: PreparedToolSet = { toolSet: {}, cleanupFunctions: [] };
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
			connectionString ?? operationNode.content.tools.postgres.connectionString,
		);
		for (const tool of operationNode.content.tools.postgres.tools) {
			if (tool in postgresTool.toolSet) {
				preparedToolSet = {
					...preparedToolSet,
					toolSet: {
						...preparedToolSet.toolSet,
						[tool]:
							postgresTool.toolSet[tool as keyof typeof postgresTool.toolSet],
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
	)
		preparedToolSet = {
			...preparedToolSet,
			toolSet: {
				...preparedToolSet.toolSet,
				openaiWebSearch: openai.tools.webSearchPreview(
					operationNode.content.tools.openaiWebSearch,
				),
			},
		};

	// if (
	// 	operationNode.content.tools?.github &&
	// 	args.context.integrationConfigs?.github
	// ) {
	// 	const auth = args.context.integrationConfigs.github.auth;
	// 	switch (auth.strategy) {
	// 		case "app-installation": {
	// 			const installationId = await auth.resolver.installationIdForRepo(
	// 				operationNode.content.tools.github.repositoryNodeId,
	// 			);
	// 			const allGitHubTools = githubTools(
	// 				octokit({
	// 					...auth,
	// 					installationId,
	// 				}),
	// 			);
	// 			for (const tool of operationNode.content.tools.github.tools) {
	// 				if (tool in allGitHubTools) {
	// 					tools = {
	// 						...tools,
	// 						[tool]: allGitHubTools[tool as keyof typeof allGitHubTools],
	// 					};
	// 				}
	// 			}
	// 			break;
	// 		}
	// 		case "personal-access-token": {
	// 			const allGitHubTools = githubTools(octokit(auth));
	// 			for (const tool of operationNode.content.tools.github.tools) {
	// 				if (tool in allGitHubTools) {
	// 					tools = {
	// 						...tools,
	// 						[tool]: allGitHubTools[tool as keyof typeof allGitHubTools],
	// 					};
	// 				}
	// 			}
	// 			break;
	// 		}
	// 		default: {
	// 			const _exhaustiveCheck: never = auth;
	// 			throw new Error(`Unhandled GitHub auth strategy: ${_exhaustiveCheck}`);
	// 		}
	// 	}
	// }

	const streamTextResult = streamText({
		model: generationModel(operationNode.content.llm),
		providerOptions: providerOptions(operationNode.content.llm),
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
				await Promise.all([
					setGeneration({
						storage: args.context.storage,
						generation: failedGeneration,
					}),
					setNodeGenerationIndex({
						storage: args.context.storage,
						nodeId: runningGeneration.context.operationNode.id,
						origin: runningGeneration.context.origin,
						nodeGenerationIndex: {
							id: failedGeneration.id,
							nodeId: failedGeneration.context.operationNode.id,
							status: "failed",
							createdAt: failedGeneration.createdAt,
							queuedAt: failedGeneration.queuedAt,
							startedAt: failedGeneration.startedAt,
							failedAt: failedGeneration.failedAt,
						},
					}),
				]);
			}

			await Promise.all(
				preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
					cleanupFunction(),
				),
			);
		},
		async onFinish(event) {
			const generationOutputs: GenerationOutput[] = [];
			const generatedTextOutput = generationContext.operationNode.outputs.find(
				(output) => output.accessor === "generated-text",
			);
			if (generatedTextOutput !== undefined) {
				generationOutputs.push({
					type: "generated-text",
					content: event.text,
					outputId: generatedTextOutput.id,
				});
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
						// When using Gemini search grounding, source provides a proxy URL
						// We need to access and resolve this proxy URL to get the actual redirect URL
						if (isVertexAiHost(source.url)) {
							const redirected = await getRedirectedUrlAndTitle(source.url);
							return {
								sourceType: "url",
								id: source.id,
								url: redirected.redirectedUrl,
								title: redirected.title,
								providerMetadata: source.providerMetadata,
							} satisfies UrlSource;
						}
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
			const completedGeneration = {
				...runningGeneration,
				status: "completed",
				completedAt: Date.now(),
				outputs: generationOutputs,
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
			} satisfies CompletedGeneration;
			await Promise.all([
				setGeneration({
					storage: args.context.storage,
					generation: completedGeneration,
				}),
				setNodeGenerationIndex({
					storage: args.context.storage,
					nodeId: runningGeneration.context.operationNode.id,
					origin: runningGeneration.context.origin,
					nodeGenerationIndex: {
						id: completedGeneration.id,
						nodeId: completedGeneration.context.operationNode.id,
						status: "completed",
						createdAt: completedGeneration.createdAt,
						queuedAt: completedGeneration.queuedAt,
						startedAt: completedGeneration.startedAt,
						completedAt: completedGeneration.completedAt,
					},
				}),
			]);

			await handleAgentTimeConsumption({
				workspaceId,
				generation: completedGeneration,
				onConsumeAgentTime: args.context.onConsumeAgentTime,
			});
			await Promise.all(
				preparedToolSet.cleanupFunctions.map((cleanupFunction) =>
					cleanupFunction(),
				),
			);
		},
		experimental_telemetry: {
			isEnabled: args.context.telemetry?.isEnabled,
			metadata: args.telemetry?.metadata,
		},
	});
	return streamTextResult;
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

function isVertexAiHost(urlString: string): boolean {
	// Disabling Vertex AI URL redirection due to frequent errors. Will monitor the impact.
	return false;
	// try {
	// 	const parsedUrl = new URL(urlString);
	// 	return ["vertexaisearch.cloud.google.com"].includes(parsedUrl.host);
	// } catch (e) {
	// 	return false;
	// }
}

function providerOptions(languageModelData: TextGenerationLanguageModelData) {
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
			} satisfies AnthropicProviderOptions,
		};
	}
}
