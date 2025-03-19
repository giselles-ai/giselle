import { fal } from "@ai-sdk/fal";
import {
	type CompletedGeneration,
	type FileData,
	type GenerationOutput,
	type NodeId,
	type Output,
	type OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	isImageGenerationNode,
} from "@giselle-sdk/data-type";
import { experimental_generateImage as generateImageAiSdk } from "ai";
import { filePath } from "../files/utils";
import type { GiselleEngineContext } from "../types";
import {
	buildMessageObject,
	getGeneration,
	getNodeGenerationIndexes,
	setGeneratedImage,
	setGeneration,
	setGenerationIndex,
	setNodeGenerationIndex,
} from "./utils";

export async function generateImage(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	const actionNode = args.generation.context.actionNode;
	if (!isImageGenerationNode(actionNode)) {
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
	let prompt = "";
	for (const message of messages) {
		prompt += message?.content ?? "";
	}
	const result = await generateImageAiSdk({
		model: fal.image(actionNode.content.llm.id),
		prompt,
		size: actionNode.content.llm.configurations.size,
		n: actionNode.content.llm.configurations.n,
	});
	const filenames = await Promise.all(
		result.images.map(async (image) => {
			const filename = `image_${Date.now()}.png`;
			await setGeneratedImage({
				storage: args.context.storage,
				generation: runningGeneration,
				generatedImage: image,
				generatedImageFilename: filename,
			});
			return filename;
		}),
	);
	const generationOutputs: GenerationOutput[] = [];

	const generatedImageOutput =
		runningGeneration.context.actionNode.outputs.find(
			(output) => output.accesor === "generated-image",
		);
	if (generatedImageOutput !== undefined) {
		generationOutputs.push({
			type: "generated-image",
			contents: filenames.map((filename) => ({ filename })),
			outputId: generatedImageOutput.id,
		});
	}
	const completedGeneration = {
		...args.generation,
		status: "completed",
		messages: [],
		ququedAt: Date.now(),
		requestedAt: Date.now(),
		startedAt: Date.now(),
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
				ququedAt: completedGeneration.ququedAt,
				requestedAt: completedGeneration.requestedAt,
				startedAt: completedGeneration.startedAt,
				completedAt: completedGeneration.completedAt,
			},
		}),
	]);
}
