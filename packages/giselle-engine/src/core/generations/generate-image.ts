import { fal } from "@ai-sdk/fal";
import {
	type CompletedGeneration,
	type FailedGeneration,
	type FileData,
	type GenerationOutput,
	type Image,
	ImageId,
	type NodeId,
	type Output,
	type OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	isCompletedGeneration,
	isImageGenerationNode,
} from "@giselle-sdk/data-type";
import { experimental_generateImage as generateImageAiSdk } from "ai";
import { Langfuse, LangfuseMedia } from "langfuse";
import { after } from "next/server";
import { UsageLimitError } from "../error";
import { filePath } from "../files/utils";
import type { GiselleEngineContext } from "../types";
import type { TelemetrySettings } from "./types";
import {
	buildMessageObject,
	checkUsageLimits,
	detectImageType,
	extractWorkspaceIdFromOrigin,
	getGeneration,
	getNodeGenerationIndexes,
	handleAgentTimeConsumption,
	setGeneratedImage,
	setGeneration,
	setGenerationIndex,
	setNodeGenerationIndex,
} from "./utils";

export async function generateImage(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	telemetry?: TelemetrySettings;
}) {
	const actionNode = args.generation.context.actionNode;
	if (!isImageGenerationNode(actionNode)) {
		throw new Error("Invalid generation type");
	}
	const langfuse = new Langfuse();
	const runningGeneration = {
		...args.generation,
		status: "running",
		messages: [],
		queuedAt: Date.now(),
		startedAt: Date.now(),
	} satisfies RunningGeneration;

	const trace = langfuse.trace({
		name: runningGeneration.id,
	});
	const generation = trace.generation({
		model: actionNode.content.llm.id,
		modelParameters: actionNode.content.llm.configurations,
	});

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
				nodeId: runningGeneration.context.actionNode.id,
				origin: runningGeneration.context.origin,
				nodeGenerationIndex: {
					id: failedGeneration.id,
					nodeId: failedGeneration.context.actionNode.id,
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
		actionNode,
		runningGeneration.context.sourceNodes,
		fileResolver,
		generationContentResolver,
	);
	let prompt = "";
	for (const message of messages) {
		if (!Array.isArray(message.content)) {
			continue;
		}
		for (const content of message.content) {
			if (content.type !== "text") {
				continue;
			}
			prompt += content.text;
		}
	}
	const result = await generateImageAiSdk({
		model: fal.image(actionNode.content.llm.id),
		prompt,
		size: actionNode.content.llm.configurations.size,
		n: actionNode.content.llm.configurations.n,
	});
	trace.update({
		input: { messages },
	});

	const generationOutputs: GenerationOutput[] = [];

	const generatedImageOutput =
		runningGeneration.context.actionNode.outputs.find(
			(output) => output.accesor === "generated-image",
		);
	if (generatedImageOutput !== undefined) {
		const contents = await Promise.all(
			result.images.map(async (image) => {
				const imageType = detectImageType(image.uint8Array);
				if (imageType === null) {
					return null;
				}
				const id = ImageId.generate();
				const filename = `${id}.${imageType.ext}`;
				await setGeneratedImage({
					storage: args.context.storage,
					generation: runningGeneration,
					generatedImage: image,
					generatedImageFilename: filename,
				});
				return {
					id,
					contentType: imageType.contentType,
					filename,
					pathname: `/generations/${runningGeneration.id}/generated-images/${filename}`,
				} satisfies Image;
			}),
		).then((results) => results.filter((result) => result !== null));

		generationOutputs.push({
			type: "generated-image",
			contents,
			outputId: generatedImageOutput.id,
		});
	}
	const completedGeneration = {
		...runningGeneration,
		status: "completed",
		messages: [],
		completedAt: Date.now(),
		outputs: generationOutputs,
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

	if (args.context.telemetry?.isEnabled && generatedImageOutput) {
		await Promise.all(
			result.images.map(async (image) => {
				const wrappedMedia = new LangfuseMedia({
					contentType: imageType.contentType as
						| "image/jpeg"
						| "image/png"
						| "image/webp"
						| "image/jpg"
						| "image/gif"
						| "image/svg+xml"
						| "image/tiff"
						| "image/bmp"
						| "audio/mpeg"
						| "audio/mp3"
						| "audio/wav"
						| "audio/ogg",
					contentBytes: Buffer.from(image.uint8Array),
				});

				generation.update({
					input: { messages },
					metadata: {
						context: wrappedMedia,
					},
				});
			}),
		);

		generation.end();

		if (args.context.telemetry?.waitForFlushFn) {
			after(args.context.telemetry.waitForFlushFn);
		}
	}
}
