import { openai } from "@ai-sdk/openai";
import { fal } from "@fal-ai/client";
import {
	type CompletedGeneration,
	type FailedGeneration,
	type FileData,
	GenerationContext,
	type GenerationOutput,
	type Image,
	type ImageGenerationNode,
	ImageId,
	type NodeId,
	type OpenAIImageLanguageModelData,
	type Output,
	type OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	isCompletedGeneration,
	isImageGenerationNode,
} from "@giselle-sdk/data-type";
import {
	type FalImageResult,
	type GeneratedImageData,
	createUsageCalculator,
} from "@giselle-sdk/language-model";
import {
	type CoreMessage,
	experimental_generateImage as generateImageAiSdk,
} from "ai";
import { type ApiMediaContentType, Langfuse, LangfuseMedia } from "langfuse";
import type { Storage } from "unstorage";
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

type ProviderOptions = Parameters<
	typeof generateImageAiSdk
>[0]["providerOptions"];

fal.config({
	credentials: process.env.FAL_API_KEY,
});
export async function generateImage(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	providerOptions?: ProviderOptions;
	telemetry?: TelemetrySettings;
}) {
	const operationNode = args.generation.context.operationNode;
	if (!isImageGenerationNode(operationNode)) {
		throw new Error("Invalid generation type");
	}
	const langfuse = new Langfuse();
	const generationContext = GenerationContext.parse(args.generation.context);
	const runningGeneration = {
		...args.generation,
		status: "running",
		messages: [],
		queuedAt: Date.now(),
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

	let generationOutputs: GenerationOutput[] = [];
	switch (operationNode.content.llm.provider) {
		case "fal":
			generationOutputs = await generateImageWithFal({
				operationNode,
				messages,
				runningGeneration,
				generationContext,
				langfuse,
				telemetry: args.telemetry,
				context: args.context,
			});
			break;
		case "openai":
			generationOutputs = await generateImageWithOpenAI({
				messages,
				runningGeneration,
				generationContext,
				languageModelData: operationNode.content.llm,
				context: args.context,
			});
			break;
		default: {
			const _exhaustiveCheck: never = operationNode.content.llm;
			throw new Error(`Unhandled generation output type: ${_exhaustiveCheck}`);
		}
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
}

async function generateImageWithFal({
	operationNode,
	generationContext,
	runningGeneration,
	messages,
	langfuse,
	telemetry,
	context,
}: {
	operationNode: ImageGenerationNode;
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	messages: CoreMessage[];
	telemetry?: TelemetrySettings;
	langfuse: Langfuse;
	context: GiselleEngineContext;
}) {
	const trace = langfuse.trace({
		name: "fal-ai/client",
		metadata: telemetry?.metadata,
		input: { messages },
	});
	const generation = trace.generation({
		name: "fal-ai/client.subscribe",
		model: operationNode.content.llm.id,
		modelParameters: operationNode.content.llm.configurations,
		input: { messages },
		usage: {
			input: 0,
			output: 0,
			unit: "IMAGES",
		},
	});

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
	const result = (await fal.subscribe(operationNode.content.llm.id, {
		input: {
			prompt,
			image_size: {
				width: Number.parseInt(
					operationNode.content.llm.configurations.size.split("x")[0],
				),
				height: Number.parseInt(
					operationNode.content.llm.configurations.size.split("x")[1],
				),
			},
			num_images: operationNode.content.llm.configurations.n,
		},
	})) as unknown as FalImageResult;

	const generationOutputs: GenerationOutput[] = [];

	const generatedImageOutput = generationContext.operationNode.outputs.find(
		(output) => output.accessor === "generated-image",
	);
	if (generatedImageOutput !== undefined) {
		const contents = await Promise.all(
			result.data.images.map(async (image) => {
				const imageType = image.content_type;
				if (imageType === null) {
					return null;
				}
				const id = ImageId.generate();
				const ext = imageType.split("/")[1];
				const filename = `${id}.${ext}`;

				const response = await fetch(image.url);
				const arrayBuffer = await response.arrayBuffer();
				const uint8Array = new Uint8Array(arrayBuffer);
				const base64 = Buffer.from(uint8Array).toString("base64");

				await setGeneratedImage({
					storage: context.storage,
					generation: runningGeneration,
					generatedImage: {
						uint8Array,
						base64,
					} satisfies GeneratedImageData,
					generatedImageFilename: filename,
				});

				return {
					id,
					contentType: imageType,
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
	if (context.telemetry?.isEnabled && generatedImageOutput) {
		const usageCalculator = createUsageCalculator(operationNode.content.llm.id);
		await Promise.all([
			...result.data.images.map(async (image) => {
				const response = await fetch(image.url);
				const arrayBuffer = await response.arrayBuffer();
				const uint8Array = new Uint8Array(arrayBuffer);

				const wrappedMedia = new LangfuseMedia({
					contentType: image.content_type as ApiMediaContentType,
					contentBytes: Buffer.from(uint8Array),
				});

				generation.update({
					metadata: {
						context: wrappedMedia,
					},
				});
			}),
			(async () => {
				const usage = usageCalculator.calculateUsage(result.data.images);
				generation.update({
					usage,
				});
				generation.end();
			})(),
		]);
	}
	return generationOutputs;
}

export async function generateImageWithOpenAI({
	messages,
	generationContext,
	runningGeneration,
	languageModelData,
	context,
}: {
	messages: CoreMessage[];
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	languageModelData: OpenAIImageLanguageModelData;
	context: GiselleEngineContext;
}) {
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
	const { images } = await generateImageAiSdk({
		model: openai.image("gpt-image-1"),
		prompt,
		n: languageModelData.configurations.n,
		size: languageModelData.configurations.size,
		providerOptions: {
			openai: {
				...languageModelData.configurations,
			},
		},
	});
	const generationOutputs: GenerationOutput[] = [];

	const generatedImageOutput = generationContext.operationNode.outputs.find(
		(output) => output.accessor === "generated-image",
	);
	if (generatedImageOutput !== undefined) {
		const contents = await Promise.all(
			images.map(async (image) => {
				const imageType = detectImageType(image.uint8Array);
				if (imageType === null) {
					return null;
				}
				const id = ImageId.generate();
				const filename = `${id}.${imageType.ext}`;

				await setGeneratedImage({
					storage: context.storage,
					generation: runningGeneration,
					generatedImage: {
						uint8Array: image.uint8Array,
						base64: image.base64,
					} satisfies GeneratedImageData,
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
	return generationOutputs;
}
