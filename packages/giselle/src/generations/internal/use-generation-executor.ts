import { parseConfiguration } from "@giselles-ai/data-store-registry";
import { isClonedFileDataPayload } from "@giselles-ai/node-registry";
import type {
	FailedGeneration,
	FileId,
	GeneratedImageContentOutput,
	NodeId,
	OutputId,
	TaskId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import {
	AppParameterId,
	type CompletedGeneration,
	type DataStoreId,
	type Generation,
	GenerationContext,
	type GenerationOutput,
	type GenerationUsage,
	isCompletedGeneration,
	isQueuedGeneration,
	type Message,
	type OutputFileBlob,
	type QueuedGeneration,
	type RunningGeneration,
	SecretId,
} from "@giselles-ai/protocol";
import type {
	DataContent,
	FilePart,
	ImagePart,
	ModelMessage,
	ProviderMetadata,
	TextPart,
} from "ai";
import { Pool } from "pg";
import { getDataStore } from "../../data-stores/get-data-store";
import { UsageLimitError } from "../../error";
import { filePath } from "../../files/utils";
import { decryptSecret } from "../../secrets/decrypt-secret";
import type { GiselleContext } from "../../types";
import type { AppEntryResolver, GenerationMetadata } from "../types";
import {
	checkUsageLimits,
	dataQueryResultToText,
	getGeneratedImage,
	getGeneration,
	getNodeGenerationIndexes,
	handleAgentTimeConsumption,
	queryResultToText,
} from "../utils";
import { getTaskGenerationIndexes } from "./get-task-generation-indexes";
import { sanitizeGenerationUsage } from "./sanitize-usage";
import { internalSetGeneration } from "./set-generation";

export interface OnGenerationCompleteEvent {
	generation: CompletedGeneration;
	inputMessages: ModelMessage[];
	outputFileBlobs: OutputFileBlob[];
	providerMetadata?: ProviderMetadata;
	generationMetadata?: GenerationMetadata;
}
export type OnGenerationComplete = (
	event: OnGenerationCompleteEvent,
) => void | Promise<void>;

export interface OnGenerationErrorEvent {
	generation: FailedGeneration;
	inputMessages: ModelMessage[];
	generationMetadata?: GenerationMetadata;
}
export type OnGenerationError = (
	args: OnGenerationErrorEvent,
) => void | Promise<void>;

interface FinishGenerationArgs {
	outputs: GenerationOutput[];
	usage?: GenerationUsage;
	generateMessages?: Message[];
	inputMessages: ModelMessage[];
	providerMetadata?: ProviderMetadata;
	generationMetadata?: GenerationMetadata;
	onComplete?: OnGenerationComplete;
}
type FinishGeneration = (args: FinishGenerationArgs) => Promise<{
	completedGeneration: CompletedGeneration;
	outputFileBlobs: OutputFileBlob[];
}>;

export async function useGenerationExecutor<T>(args: {
	context: GiselleContext;
	generation: QueuedGeneration | RunningGeneration;
	signal?: AbortSignal;
	metadata?: GenerationMetadata;
	execute: (utils: {
		runningGeneration: RunningGeneration;
		generationContext: GenerationContext;
		setGeneration: (generation: Generation) => Promise<void>;
		fileResolver: (fileId: FileId) => Promise<DataContent>;
		generationContentResolver: (
			nodeId: NodeId,
			outputId: OutputId,
		) => Promise<string | undefined>;
		imageGenerationResolver: (
			nodeId: NodeId,
			outputId: OutputId,
		) => Promise<ImagePart[] | undefined>;
		appEntryResolver: AppEntryResolver;
		dataStoreSchemaResolver: (
			dataStoreId: DataStoreId,
		) => Promise<string | undefined>;
		workspaceId: WorkspaceId;
		signal?: AbortSignal;
		finishGeneration: FinishGeneration;
	}) => Promise<T>;
	onError?: OnGenerationError;
}): Promise<T> {
	const generationContext = GenerationContext.parse(args.generation.context);

	const runningGeneration: RunningGeneration = isQueuedGeneration(
		args.generation,
	)
		? {
				...args.generation,
				status: "running",
				messages: [],
				startedAt: Date.now(),
			}
		: args.generation;

	const setGeneration = async (generation: Generation) => {
		await internalSetGeneration({
			storage: args.context.storage,
			generation,
		});
	};

	if (isQueuedGeneration(args.generation)) {
		await setGeneration(runningGeneration);
	}
	let workspaceId: WorkspaceId;
	switch (args.generation.context.origin.type) {
		case "stage":
		case "api":
		case "github-app":
			workspaceId = args.generation.context.origin.workspaceId;
			break;
		case "studio":
			workspaceId = args.generation.context.origin.workspaceId;
			break;
		default: {
			const _exhaustiveCheck: never = args.generation.context.origin;
			throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
		}
	}
	const usageLimitCheckStartTime = Date.now();
	const usageLimitStatus = await checkUsageLimits({
		workspaceId,
		generation: args.generation,
		fetchUsageLimitsFn: args.context.fetchUsageLimitsFn,
	});
	args.context.logger.info(
		`Usage limit check completed in ${Date.now() - usageLimitCheckStartTime}ms`,
	);
	if (usageLimitStatus.type === "error") {
		const failedGeneration: Generation = {
			...runningGeneration,
			status: "failed",
			failedAt: Date.now(),
			error: {
				name: usageLimitStatus.error,
				message: usageLimitStatus.error,
				dump: usageLimitStatus,
			},
		} as const;
		await Promise.all([
			setGeneration(failedGeneration),
			args?.onError?.({ generation: failedGeneration, inputMessages: [] }),
		]);
		throw new UsageLimitError(usageLimitStatus.error);
	}

	// Build file ID mapping for duplicated nodes
	// This allows fileResolver to find the actual storage file ID for cloned files
	const fileIdMap = new Map<FileId, FileId>();
	for (const sourceNode of generationContext.sourceNodes) {
		if (sourceNode.content.type !== "file") {
			continue;
		}
		for (const file of sourceNode.content.files) {
			const actualFileId = isClonedFileDataPayload(file)
				? file.originalFileIdForCopy
				: file.id;
			fileIdMap.set(file.id, actualFileId);
		}
	}

	async function fileResolver(fileId: FileId): Promise<DataContent> {
		const fileRetrievalStartTime = Date.now();

		// Get the actual file ID from the map (handles cloned files)
		const actualFileId = fileIdMap.get(fileId) ?? fileId;

		const path = filePath({
			...runningGeneration.context.origin,
			fileId: actualFileId,
		});
		const exists = await args.context.storage.exists(path);
		const blob = exists ? await args.context.storage.getBlob(path) : undefined;
		args.context.logger.info(
			`File retrieval completed in ${Date.now() - fileRetrievalStartTime}ms (fileId: ${fileId})`,
		);
		if (blob === undefined) {
			args.context.logger.warn(`File not found (fileId: ${fileId})`);
			return new Uint8Array() as DataContent;
		}
		return blob as DataContent;
	}
	function findGeneration(nodeId: NodeId) {
		const taskId = runningGeneration.context.origin.taskId;
		if (taskId === undefined) {
			return findGenerationByNode(nodeId);
		}
		return findGenerationByTask(nodeId, taskId);
	}
	async function findGenerationByNode(nodeId: NodeId) {
		const generationLookupStartTime = Date.now();
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			storage: args.context.storage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			args.context.logger.info(
				`Generation lookup by node completed in ${Date.now() - generationLookupStartTime}ms (nodeId: ${nodeId}, found: false)`,
			);
			return undefined;
		}
		const generation = await getGeneration({
			storage: args.context.storage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		});
		args.context.logger.info(
			`Generation lookup by node completed in ${Date.now() - generationLookupStartTime}ms (nodeId: ${nodeId}, found: true)`,
		);
		return generation;
	}
	async function findGenerationByTask(nodeId: NodeId, taskId: TaskId) {
		const taskGenerationLookupStartTime = Date.now();
		const taskGenerationIndexes = await getTaskGenerationIndexes({
			storage: args.context.storage,
			taskId,
		});
		const targetGenerationIndex = taskGenerationIndexes?.find(
			(taskGenerationIndex) => taskGenerationIndex.nodeId === nodeId,
		);
		if (targetGenerationIndex === undefined) {
			args.context.logger.info(
				`Generation lookup by task completed in ${Date.now() - taskGenerationLookupStartTime}ms (nodeId: ${nodeId}, taskId: ${taskId}, found: false)`,
			);
			return undefined;
		}
		const generation = await getGeneration({
			storage: args.context.storage,
			generationId: targetGenerationIndex.id,
		});
		args.context.logger.info(
			`Generation lookup by task completed in ${Date.now() - taskGenerationLookupStartTime}ms (nodeId: ${nodeId}, taskId: ${taskId}, found: true)`,
		);
		return generation;
	}
	function findOutput(outputId: OutputId) {
		for (const sourceNode of runningGeneration.context.sourceNodes) {
			for (const sourceOutput of sourceNode.outputs) {
				if (sourceOutput.id === outputId) {
					return sourceOutput;
				}
			}
		}
		return undefined;
	}
	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
		function formatGenerationOutput(generationOutput: GenerationOutput) {
			switch (generationOutput.type) {
				case "source":
					return JSON.stringify(generationOutput.sources);
				case "generated-text":
					return generationOutput.content;
				case "query-result":
					return queryResultToText(generationOutput);
				case "data-query-result":
					return dataQueryResultToText(generationOutput);
				default:
					throw new Error("Generation output type is not supported");
			}
		}

		const generation = await findGeneration(nodeId);
		if (generation === undefined || !isCompletedGeneration(generation)) {
			return undefined;
		}

		const output = findOutput(outputId);
		if (output === undefined) {
			return undefined;
		}

		const generationOutput = generation.outputs.find(
			(o) => o.outputId === outputId,
		);
		if (generationOutput === undefined) {
			return undefined;
		}

		return formatGenerationOutput(generationOutput);
	}
	async function imageGenerationResolver(
		nodeId: NodeId,
		outputId: OutputId,
	): Promise<ImagePart[] | undefined> {
		const generation = await findGeneration(nodeId);
		if (generation === undefined || !isCompletedGeneration(generation)) {
			return undefined;
		}

		const output = findOutput(outputId);
		if (output === undefined) {
			return undefined;
		}

		const imageGenerationOutput = generation.outputs.find(
			(o): o is GeneratedImageContentOutput =>
				o.type === "generated-image" && o.outputId === outputId,
		);

		if (imageGenerationOutput === undefined) {
			return undefined;
		}

		const imageParts = await Promise.all(
			imageGenerationOutput.contents.map(async (content) => {
				try {
					const image = await getGeneratedImage({
						storage: args.context.storage,
						generation,
						filename: content.filename,
					});

					return {
						type: "image",
						image,
						mediaType: content.contentType,
					} satisfies ImagePart;
				} catch (error) {
					args.context.logger.error(
						error instanceof Error ? error : new Error(String(error)),
						`Failed to load generated image: ${content.filename}`,
					);
					return undefined;
				}
			}),
		).then((results) => results.filter((result) => result !== undefined));

		return imageParts.length > 0 ? imageParts : undefined;
	}

	async function dataStoreSchemaResolver(
		dataStoreId: DataStoreId,
	): Promise<string | undefined> {
		const schemaRetrievalStartTime = Date.now();

		try {
			const dataStore = await getDataStore({
				context: args.context,
				dataStoreId,
			});
			if (!dataStore) {
				throw new Error(`DataStore not found: ${dataStoreId}`);
			}

			const config = parseConfiguration(
				dataStore.provider,
				dataStore.configuration,
			);

			const connectionString = await decryptSecret({
				context: args.context,
				secretId: SecretId.parse(config.connectionStringSecretId),
			});

			if (connectionString === undefined) {
				args.context.logger.warn(
					`Failed to decrypt connection string for data store: ${dataStoreId}`,
				);
				return undefined;
			}

			const pool = new Pool({
				connectionString,
				connectionTimeoutMillis: 10000,
				query_timeout: 25000,
				statement_timeout: 20000,
			});
			try {
				const res = await pool.query(`
          SELECT table_name, column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position
        `);
				args.context.logger.info(
					`Schema retrieval completed in ${Date.now() - schemaRetrievalStartTime}ms (dataStoreId: ${dataStoreId})`,
				);
				return JSON.stringify(res.rows);
			} finally {
				try {
					await pool.end();
				} catch {
					args.context.logger.warn(
						`Failed to close pool for data store: ${dataStoreId}`,
					);
				}
			}
		} catch {
			// Error details are not logged to prevent exposing sensitive data
			args.context.logger.warn(
				`Failed to retrieve schema for data store: ${dataStoreId}`,
			);
			return undefined;
		}
	}

	async function finishGeneration({
		outputs,
		usage,
		inputMessages,
		generateMessages,
		providerMetadata,
		onComplete,
	}: FinishGenerationArgs) {
		const sanitizedUsage = sanitizeGenerationUsage(usage);
		const completionStartTime = Date.now();
		const completedGeneration = {
			...runningGeneration,
			status: "completed",
			completedAt: Date.now(),
			outputs,
			usage: sanitizedUsage,
			messages: generateMessages ?? [],
		} satisfies CompletedGeneration;

		/** @todo create type alias */
		const outputFileBlobs: OutputFileBlob[] = [];
		const imageProcessingStartTime = Date.now();
		for (const output of outputs) {
			if (output.type !== "generated-image") {
				continue;
			}
			for (const content of output.contents) {
				const bytes = await getGeneratedImage({
					storage: args.context.storage,
					generation: args.generation,
					filename: content.filename,
				});

				outputFileBlobs.push({
					id: content.id,
					outputId: output.outputId,
					contentType: content.contentType,
					bytes,
				});
			}
		}
		args.context.logger.info(
			`Image processing completed in ${Date.now() - imageProcessingStartTime}ms (${outputFileBlobs.length} images)`,
		);

		const finalProcessingStartTime = Date.now();
		await Promise.all([
			setGeneration(completedGeneration),
			handleAgentTimeConsumption({
				workspaceId,
				generation: completedGeneration,
				onConsumeAgentTime: args.context.onConsumeAgentTime,
			}),
			(async () => {
				const result = await onComplete?.({
					generation: completedGeneration,
					inputMessages,
					outputFileBlobs,
					providerMetadata,
					generationMetadata: args.metadata,
				});
				return result;
			})(),
		]);
		args.context.logger.info(
			`Final processing completed in ${Date.now() - finalProcessingStartTime}ms`,
		);
		args.context.logger.info(
			`Generation completion total time: ${Date.now() - completionStartTime}ms`,
		);
		return { completedGeneration, outputFileBlobs };
	}

	const appEntryResolver: AppEntryResolver = async (nodeId, outputId) => {
		const appEntryNode = args.generation.context.sourceNodes.find(
			(sourceNode) => sourceNode.id === nodeId,
		);
		if (appEntryNode === undefined) {
			throw new Error(`Node<${nodeId}> not found`);
		}
		const output = appEntryNode.outputs.find(
			(output) => output.id === outputId,
		);

		if (output === undefined) {
			throw new Error(`Output<${outputId}> not found`);
		}

		const parseResult = AppParameterId.safeParse(output.accessor);

		if (!parseResult.success) {
			throw new Error(`Invalid app parameter id: ${output.accessor}`);
		}
		const parameterInput = generationContext.inputs?.find(
			(input) => input.type === "parameters",
		);
		if (parameterInput === undefined) {
			throw new Error(`No parameters input found`);
		}
		const parameter = parameterInput.items.find(
			(item) => item.name === parseResult.data,
		);

		if (parameter === undefined) {
			args.context.logger.warn(
				{ parameterInput },
				`Parameter ${parseResult.data} not found`,
			);
			return [];
		}

		switch (parameter.type) {
			case "files":
				return await Promise.all(
					parameter.value.map(async (fileParameter) => {
						const path = filePath({
							...runningGeneration.context.origin,
							fileId: fileParameter.id,
						});

						const exists = await args.context.storage.exists(path);
						if (!exists) {
							args.context.logger.warn(
								{ id: fileParameter.id },
								`File not found for app parameter`,
							);
							return undefined;
						}

						const blob = await args.context.storage.getBlob(path);

						switch (fileParameter.type) {
							case "image/jpeg":
							case "image/png":
							case "image/gif":
							case "image/svg":
								return {
									type: "image",
									image: blob,
								} as ImagePart;
							case "application/pdf":
								return {
									type: "file",
									filename: fileParameter.name,
									data: blob,
									mediaType: "application/pdf",
								} as FilePart;
							default: {
								args.context.logger.warn(
									{ id: fileParameter.id, type: fileParameter.type },
									`File type not supported`,
								);
								return undefined;
							}
						}
					}),
				).then((parts) => parts.filter((part) => part !== undefined));
			case "number":
				return [
					{
						type: "text",
						text: `${parameter.value}`,
					} satisfies TextPart,
				];
			case "string":
				return [
					{
						type: "text",
						text: parameter.value,
					} satisfies TextPart,
				];
			default: {
				const _exhaustiveCheck: never = parameter;
				args.context.logger.warn(
					{ _exhaustiveCheck },
					`Unhandled parameter type`,
				);

				return [];
			}
		}
	};

	return args.execute({
		runningGeneration,
		generationContext,
		setGeneration,
		fileResolver,
		generationContentResolver,
		imageGenerationResolver,
		workspaceId,
		signal: args.signal,
		finishGeneration,
		appEntryResolver,
		dataStoreSchemaResolver,
	});
}
