import {
	type CompletedGeneration,
	type FailedGeneration,
	GenerationContext,
	type GenerationOutput,
	NodeId,
	type Output,
	OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	type VectorStoreNode,
	type WorkspaceId,
	isCompletedGeneration,
	isQueryNode,
	isTextNode,
} from "@giselle-sdk/data-type";
import { query as queryRag } from "@giselle-sdk/rag";
import { isJsonContent, jsonContentToText } from "@giselle-sdk/text-editor";
import type { Storage } from "unstorage";
import {
	getGeneration,
	getNodeGenerationIndexes,
	setGeneration,
	setGenerationIndex,
	setNodeGenerationIndex,
} from "../generations/utils";
import type { GiselleEngineContext } from "../types";

export async function executeQuery(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	const { context, generation: initialGeneration } = args;

	const operationNode = initialGeneration.context.operationNode;
	if (!isQueryNode(operationNode)) {
		throw new Error("Invalid generation type for executeQuery");
	}

	const runningGeneration = {
		...initialGeneration,
		status: "running",
		messages: [],
		startedAt: Date.now(),
	} satisfies RunningGeneration;

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

	let workspaceId: WorkspaceId | undefined;
	switch (initialGeneration.context.origin.type) {
		case "run":
			workspaceId = initialGeneration.context.origin.workspaceId;
			break;
		case "workspace":
			workspaceId = initialGeneration.context.origin.id;
			break;
		default: {
			const _exhaustiveCheck: never = initialGeneration.context.origin;
			throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
		}
	}

	try {
		const generationContext = GenerationContext.parse(
			initialGeneration.context,
		);

		const query = await resolveQuery(
			operationNode.content.query,
			runningGeneration,
			context.storage,
		);

		const vectorStoreNodes = generationContext.sourceNodes.filter(
			(node) =>
				node.type === "variable" &&
				node.content.type === "vectorStore" &&
				generationContext.connections.some(
					(connection) => connection.outputNode.id === node.id,
				),
		);
		const queryResults = await queryVectorStore(
			workspaceId,
			query,
			context,
			vectorStoreNodes as VectorStoreNode[],
		);

		const outputId = initialGeneration.context.operationNode.outputs.find(
			(output) => output.accessor === "result",
		)?.id;
		if (outputId === undefined) {
			throw new Error("query-results output not found in operation node");
		}
		const outputs: GenerationOutput[] = [
			{
				type: "query-result",
				content: queryResults,
				outputId,
			},
		];

		const completedGeneration = {
			...runningGeneration,
			status: "completed",
			completedAt: Date.now(),
			outputs,
		} satisfies CompletedGeneration;

		await Promise.all([
			setGeneration({
				storage: context.storage,
				generation: completedGeneration,
			}),
			setNodeGenerationIndex({
				storage: context.storage,
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
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		const failedGeneration = {
			...runningGeneration,
			status: "failed",
			failedAt: Date.now(),
			error: {
				name: err.name,
				message: err.message,
			},
		} satisfies FailedGeneration;

		await Promise.all([
			setGeneration({
				storage: context.storage,
				generation: failedGeneration,
			}),
			setNodeGenerationIndex({
				storage: context.storage,
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
		throw error;
	}
}

async function resolveQuery(
	query: string,
	runningGeneration: RunningGeneration,
	storage: Storage,
) {
	const generationContext = GenerationContext.parse(runningGeneration.context);

	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			origin: runningGeneration.context.origin,
			storage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			return undefined;
		}
		const generation = await getGeneration({
			storage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
			options: {
				bypassingCache: true,
			},
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
			case "query-result":
				// TODO: format for context
				throw new Error("Not implemented");
			default: {
				const _exhaustiveCheck: never = generationOutput;
				throw new Error(
					`Unhandled generation output type: ${_exhaustiveCheck}`,
				);
			}
		}
	}

	let resolvedQuery = query;

	if (isJsonContent(query)) {
		resolvedQuery = jsonContentToText(JSON.parse(query));
	}

	// Find all references in the format {{nd-XXXX:otp-XXXX}}
	const pattern = /\{\{(nd-[a-zA-Z0-9]+):(otp-[a-zA-Z0-9]+)\}\}/g;
	const sourceKeywords = [...resolvedQuery.matchAll(pattern)].map((match) => ({
		nodeId: NodeId.parse(match[1]),
		outputId: OutputId.parse(match[2]),
	}));

	for (const sourceKeyword of sourceKeywords) {
		const contextNode = generationContext.sourceNodes.find(
			(contextNode) => contextNode.id === sourceKeyword.nodeId,
		);
		if (contextNode === undefined) {
			continue;
		}
		const replaceKeyword = `{{${sourceKeyword.nodeId}:${sourceKeyword.outputId}}}`;

		switch (contextNode.content.type) {
			case "text": {
				if (!isTextNode(contextNode)) {
					throw new Error(`Unexpected node data: ${contextNode.id}`);
				}
				const jsonOrText = contextNode.content.text;
				const text = isJsonContent(jsonOrText)
					? jsonContentToText(JSON.parse(jsonOrText))
					: jsonOrText;
				resolvedQuery = resolvedQuery.replace(replaceKeyword, text);
				break;
			}
			case "textGeneration": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from query)
				resolvedQuery = resolvedQuery.replace(replaceKeyword, result ?? "");
				break;
			}
			case "file":
			case "github":
			case "imageGeneration":
				throw new Error("Not implemented");

			case "trigger":
			case "action": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from query)
				resolvedQuery = resolvedQuery.replace(replaceKeyword, result ?? "");
				break;
			}
			case "query":
			case "vectorStore":
				break;
			default: {
				const _exhaustiveCheck: never = contextNode.content;
				throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
			}
		}
	}

	return resolvedQuery;
}

function isConfiguredVectorStoreNode(
	vectorStoreNode: VectorStoreNode,
): vectorStoreNode is VectorStoreNode & {
	content: {
		source: {
			state: {
				status: "configured";
			};
		};
	};
} {
	const { content } = vectorStoreNode;
	const { source } = content;
	const { state } = source;
	return state.status === "configured";
}

async function queryVectorStore(
	workspaceId: WorkspaceId,
	query: string,
	context: GiselleEngineContext,
	vectorStoreNodes: VectorStoreNode[],
) {
	const { vectorStoreQueryFunctions } = context;
	if (vectorStoreQueryFunctions === undefined) {
		throw new Error("No vector store query function provided");
	}

	const results = await Promise.all(
		vectorStoreNodes
			.filter(isConfiguredVectorStoreNode)
			.map(async (vectorStoreNode) => {
				const { content } = vectorStoreNode;
				const { source } = content;
				const { provider, state } = source;

				switch (provider) {
					case "github": {
						const { github } = vectorStoreQueryFunctions;
						if (github === undefined) {
							throw new Error("No github vector store query function provided");
						}
						const { owner, repo } = state;
						const res = await queryRag({
							question: query,
							limit: 10,
							similarityThreshold: 0.2,
							filters: {
								workspaceId,
								owner,
								repo,
							},
							queryFunction: github,
						});
						return {
							type: "vector-store" as const,
							source,
							records: res.map((record) => ({
								chunkContent: record.chunk.content,
								chunkIndex: record.chunk.index,
								score: record.score,
								metadata: record.metadata,
							})),
						};
					}
					default: {
						const _exhaustiveCheck: never = provider;
						throw new Error(
							`Unsupported vector store provider: ${_exhaustiveCheck}`,
						);
					}
				}
			}),
	);

	return results;
}
