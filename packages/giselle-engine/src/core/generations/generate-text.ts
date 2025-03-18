import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { perplexity } from "@ai-sdk/perplexity";
import {
	type CompletedGeneration,
	type FailedGeneration,
	type FileData,
	type GenerationOutput,
	type NodeId,
	type Output,
	type OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	type TextGenerationLanguageModelData,
	type TextGenerationNode,
	type UrlSource,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import { AISDKError, appendResponseMessages, streamText } from "ai";
import { filePath } from "../files/utils";
import type { GiselleEngineContext } from "../types";
import {
	buildMessageObject,
	getGeneration,
	getNodeGenerationIndexes,
	getRedirectedUrlAndTitle,
	setGeneration,
	setGenerationIndex,
	setNodeGenerationIndex,
} from "./utils";

export async function generateText(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	const actionNode = args.generation.context.actionNode;
	if (!isTextGenerationNode(actionNode)) {
		throw new Error("Invalid generation type");
	}
	const runningGeneration = {
		...args.generation,
		status: "running",
		messages: [],
		ququedAt: Date.now(),
		requestedAt: Date.now(),
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
			nodeId: runningGeneration.context.actionNode.id,
			origin: runningGeneration.context.origin,
			nodeGenerationIndex: {
				id: runningGeneration.id,
				nodeId: runningGeneration.context.actionNode.id,
				status: "running",
				createdAt: runningGeneration.createdAt,
				ququedAt: runningGeneration.ququedAt,
				requestedAt: runningGeneration.requestedAt,
				startedAt: runningGeneration.startedAt,
			},
		}),
	]);
	async function fileResolver(file: FileData) {
		const blob = await args.context.storage.getItemRaw(
			filePath({
				...runningGeneration.context.origin,
				fileId: file.id,
				fileName: file.name,
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
		if (generation?.status !== "completed") {
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
		actionNode,
		runningGeneration.context.sourceNodes,
		fileResolver,
		generationContentResolver,
	);

	const streamTextResult = streamText({
		model: generationModel(actionNode.content.llm),
		messages,
		onError: async ({ error }) => {
			if (AISDKError.isInstance(error)) {
				const failedGeneration = {
					...runningGeneration,
					status: "failed",
					failedAt: Date.now(),
					error: {
						name: error.name,
						message: error.message,
						dump: error,
					},
				} satisfies FailedGeneration;
				await Promise.all([
					setGeneration({
						storage: args.context.storage,
						generation: failedGeneration,
					}),
					setNodeGenerationIndex({
						storage: args.context.storage,
						nodeId: runningGeneration.context.actionNode.id,
						origin: runningGeneration.context.origin,
						nodeGenerationIndex: {
							id: failedGeneration.id,
							nodeId: failedGeneration.context.actionNode.id,
							status: "failed",
							createdAt: failedGeneration.createdAt,
							ququedAt: failedGeneration.ququedAt,
							requestedAt: failedGeneration.requestedAt,
							startedAt: failedGeneration.startedAt,
							failedAt: failedGeneration.failedAt,
						},
					}),
				]);
			}
		},
		async onFinish(event) {
			const generationOutputs: GenerationOutput[] = [];
			const generatedTextOutput =
				runningGeneration.context.actionNode.outputs.find(
					(output) => output.accesor === "generated-text",
				);
			if (generatedTextOutput !== undefined) {
				generationOutputs.push({
					type: "generated-text",
					content: event.text,
					outputId: generatedTextOutput.id,
				});
			}
			const reasoningOutput = runningGeneration.context.actionNode.outputs.find(
				(output) => output.accesor === "reasoning",
			);
			if (reasoningOutput !== undefined && event.reasoning !== undefined) {
				generationOutputs.push({
					type: "reasoning",
					content: event.reasoning,
					outputId: reasoningOutput.id,
				});
			}
			const sourceOutput = runningGeneration.context.actionNode.outputs.find(
				(output) => output.accesor === "source",
			);
			if (sourceOutput !== undefined && event.sources.length > 0) {
				const sources = await Promise.all(
					event.sources.map(async (source) => {
						const redirected = await getRedirectedUrlAndTitle(source.url);
						return {
							sourceType: "url",
							id: source.id,
							url: redirected.redirectedUrl,
							title: redirected.title,
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
					nodeId: runningGeneration.context.actionNode.id,
					origin: runningGeneration.context.origin,
					nodeGenerationIndex: {
						id: completedGeneration.id,
						nodeId: completedGeneration.context.actionNode.id,
						status: "completed",
						createdAt: completedGeneration.createdAt,
						ququedAt: completedGeneration.ququedAt,
						requestedAt: completedGeneration.requestedAt,
						startedAt: completedGeneration.startedAt,
						completedAt: completedGeneration.completedAt,
					},
				}),
			]);
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
			return openai(languageModel.id);
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
