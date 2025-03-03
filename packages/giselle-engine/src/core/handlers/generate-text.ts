import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import {
	type CompletedGeneration,
	type FailedGeneration,
	type FileData,
	type LLM,
	type NodeId,
	QueuedGeneration,
	type RunningGeneration,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import { AISDKError, appendResponseMessages, streamText } from "ai";
import { z } from "zod";
import { createHandler } from "../create-handler";
import {
	buildMessageObject,
	filePath,
	getGeneration,
	getNodeGenerationIndexes,
	setGeneration,
	setGenerationIndex,
	setNodeGenerationIndex,
} from "../helpers";

const input = z.object({
	generation: QueuedGeneration,
});
export type Input = z.infer<typeof input>;

const output = z.object({
	text: z.string(),
});
export type Output = z.infer<typeof output>;

export const generateText = createHandler(
	{
		input,
	},
	async ({ input, context }) => {
		const runningGeneration = {
			...input.generation,
			status: "running",
			messages: [],
			ququedAt: Date.now(),
			requestedAt: Date.now(),
			startedAt: Date.now(),
		} satisfies RunningGeneration;
		if (!isTextGenerationNode(runningGeneration.context.actionNode)) {
			throw new Error("Invalid action node");
		}

		await Promise.all([
			setGeneration({
				storage: context.storage,
				generation: runningGeneration,
			}),
			setGenerationIndex({
				storage: context.storage,
				generationIndex: {
					id: runningGeneration.id,
					origin: runningGeneration.context.origin,
				},
			}),
			setNodeGenerationIndex({
				storage: context.storage,
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
			const blob = await context.storage.getItemRaw(
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

		async function generationContentResolver(nodeId: NodeId) {
			const nodeGenerationIndexes = await getNodeGenerationIndexes({
				origin: runningGeneration.context.origin,
				storage: context.storage,
				nodeId,
			});
			if (
				nodeGenerationIndexes === undefined ||
				nodeGenerationIndexes.length === 0
			) {
				return undefined;
			}
			const generation = await getGeneration({
				...input,
				storage: context.storage,
				generationId:
					nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
			});
			if (generation?.status !== "completed") {
				return undefined;
			}
			const assistantMessages = generation.messages.filter(
				(m) => m.role === "assistant",
			);
			if (assistantMessages.length === 0) {
				return undefined;
			}
			return assistantMessages[assistantMessages.length - 1].content;
		}
		const messages = await buildMessageObject(
			runningGeneration.context.actionNode,
			runningGeneration.context.sourceNodes,
			fileResolver,
			generationContentResolver,
		);

		const streamTextResult = streamText({
			model: generationModel(runningGeneration.context.actionNode.content.llm),
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
							storage: context.storage,
							generation: failedGeneration,
						}),
						setNodeGenerationIndex({
							storage: context.storage,
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
				const completedGeneration = {
					...runningGeneration,
					status: "completed",
					completedAt: Date.now(),
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
						storage: context.storage,
						generation: completedGeneration,
					}),
					setNodeGenerationIndex({
						storage: context.storage,
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

		return streamTextResult.toDataStreamResponse();
	},
);

function generationModel(llm: LLM) {
	const llmProvider = llm.provider;
	switch (llmProvider) {
		case "anthropic": {
			return anthropic(llm.model);
		}
		case "openai": {
			return openai(llm.model);
		}
		case "google": {
			return google(llm.model, {
				useSearchGrounding: llm.searchGrounding,
			});
		}
		default: {
			const _exhaustiveCheck: never = llmProvider;
			throw new Error(`Unknown LLM provider: ${_exhaustiveCheck}`);
		}
	}
}
