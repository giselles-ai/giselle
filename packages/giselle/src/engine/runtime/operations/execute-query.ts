import {
	DEFAULT_EMBEDDING_PROFILE_ID,
	DEFAULT_MAX_RESULTS,
	DEFAULT_SIMILARITY_THRESHOLD,
	type DocumentVectorStoreSource,
	type FailedGeneration,
	GenerationContext,
	type GenerationOutput,
	type GitHubVectorStoreSource,
	isCompletedGeneration,
	isQueryNode,
	isTextNode,
	NodeId,
	type Output,
	OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	type VectorStoreNode,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import type { EmbeddingMetrics } from "@giselles-ai/rag";
import type { GiselleStorage } from "@giselles-ai/storage";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselles-ai/text-editor-utils";
import type {
	DocumentVectorStoreQueryContext,
	GiselleEngineContext,
	GitHubQueryContext,
} from "../../contracts";
import type { GenerationMetadata } from "../generations";
import { useGenerationExecutor } from "../generations/internal/use-generation-executor";
import {
	getGeneration,
	getNodeGenerationIndexes,
	queryResultToText,
} from "../generations/utils";

export function executeQuery(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	metadata?: GenerationMetadata;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		metadata: args.metadata,
		execute: async ({
			runningGeneration,
			generationContext,
			finishGeneration,
			setGeneration,
			workspaceId,
		}) => {
			try {
				const operationNode = generationContext.operationNode;
				if (!isQueryNode(operationNode)) {
					throw new Error("Invalid generation type for executeQuery");
				}

				const query = await resolveQuery(
					operationNode.content.query,
					runningGeneration,
					args.context.storage,
				);

				const vectorStoreNodes = generationContext.sourceNodes.filter(
					(node) =>
						node.content.type === "vectorStore" &&
						generationContext.connections.some(
							(connection) => connection.outputNode.id === node.id,
						),
				);

				const queryResults = await queryVectorStore(
					workspaceId,
					query,
					runningGeneration,
					args.context,
					vectorStoreNodes as VectorStoreNode[],
					operationNode.content.maxResults,
					operationNode.content.similarityThreshold,
					args.metadata,
				);

				const outputId = generationContext.operationNode.outputs.find(
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

				await finishGeneration({
					inputMessages: [],
					outputs,
				});
			} catch (error) {
				const failedGeneration = {
					...runningGeneration,
					status: "failed",
					failedAt: Date.now(),
					error: {
						name: error instanceof Error ? error.name : "UnknownError",
						message: error instanceof Error ? error.message : String(error),
						dump: error,
					},
				} satisfies FailedGeneration;

				await setGeneration(failedGeneration);
				throw error;
			}
		},
	});
}

async function resolveQuery(
	query: string,
	runningGeneration: RunningGeneration,
	storage: GiselleStorage,
) {
	const generationContext = GenerationContext.parse(runningGeneration.context);

	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			storage: storage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			return undefined;
		}
		const generation = await getGeneration({
			storage: storage,
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
			case "query-result":
				return queryResultToText(generationOutput);
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
			case "webPage":
			case "github":
			case "imageGeneration":
				throw new Error("Not implemented");

			case "trigger":
			case "action":
			case "appEntry": {
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

type ConfiguredGitHubVectorStoreSource = GitHubVectorStoreSource & {
	state: Extract<GitHubVectorStoreSource["state"], { status: "configured" }>;
};

type ConfiguredDocumentVectorStoreSource = DocumentVectorStoreSource & {
	state: Extract<DocumentVectorStoreSource["state"], { status: "configured" }>;
};

type ConfiguredVectorStoreSource =
	| ConfiguredGitHubVectorStoreSource
	| ConfiguredDocumentVectorStoreSource;

function isConfiguredVectorStoreNode(
	vectorStoreNode: VectorStoreNode,
): vectorStoreNode is VectorStoreNode & {
	content: {
		source: ConfiguredVectorStoreSource;
	};
} {
	const { content } = vectorStoreNode;
	const { source } = content;
	const { provider, state } = source;

	if (state.status !== "configured") {
		return false;
	}

	return provider === "github" || provider === "document";
}

async function queryVectorStore(
	workspaceId: WorkspaceId,
	query: string,
	runningGeneration: RunningGeneration,
	context: GiselleEngineContext,
	vectorStoreNodes: VectorStoreNode[],
	maxResults?: number,
	similarityThreshold?: number,
	metadata?: GenerationMetadata,
) {
	if (vectorStoreNodes.length === 0) {
		return [];
	}

	const { vectorStoreQueryServices } = context;
	if (vectorStoreQueryServices === undefined) {
		throw new Error("No vector store query service provided");
	}

	if (query.trim().length === 0) {
		throw new Error("Query is empty");
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
						const { owner, repo, contentType } = state;

						const embeddingProfileId =
							state.embeddingProfileId ?? DEFAULT_EMBEDDING_PROFILE_ID;

						switch (contentType) {
							case "blob": {
								if (!vectorStoreQueryServices?.github) {
									throw new Error(
										"No github vector store query service provided",
									);
								}

								const queryContext: GitHubQueryContext = {
									provider: "github" as const,
									workspaceId,
									owner,
									repo,
									contentType: "blob",
									embeddingProfileId,
								};

								const res = await vectorStoreQueryServices.github.search(
									query,
									queryContext,
									maxResults ?? DEFAULT_MAX_RESULTS,
									similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD,
									async (embeddingMetrics: EmbeddingMetrics) => {
										await context.callbacks?.embeddingComplete?.({
											embeddingMetrics,
											generation: runningGeneration,
											queryContext,
											generationMetadata: metadata,
										});
									},
								);
								return {
									type: "vector-store" as const,
									source,
									records: res.map((result) => ({
										chunkContent: result.chunk.content,
										chunkIndex: result.chunk.index,
										score: result.similarity,
										metadata: Object.fromEntries(
											Object.entries(result.metadata ?? {}).map(([k, v]) => [
												k,
												String(v),
											]),
										),
									})),
								};
							}

							case "pull_request": {
								if (!vectorStoreQueryServices?.githubPullRequest) {
									throw new Error(
										"No github pull request vector store query service provided",
									);
								}

								const queryContext: GitHubQueryContext = {
									provider: "github" as const,
									workspaceId,
									owner,
									repo,
									contentType: "pullRequest",
									embeddingProfileId,
								};

								const res =
									await vectorStoreQueryServices.githubPullRequest.search(
										query,
										queryContext,
										maxResults ?? DEFAULT_MAX_RESULTS,
										similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD,
										async (embeddingMetrics: EmbeddingMetrics) => {
											await context.callbacks?.embeddingComplete?.({
												embeddingMetrics,
												generation: runningGeneration,
												queryContext,
												generationMetadata: metadata,
											});
										},
									);
								return {
									type: "vector-store" as const,
									source,
									records: res.map((result) => ({
										chunkContent: result.chunk.content,
										chunkIndex: result.chunk.index,
										score: result.similarity,
										metadata: Object.fromEntries(
											Object.entries(result.metadata ?? {}).map(([k, v]) => [
												k,
												String(v),
											]),
										),
										additional: result.additional,
									})),
								};
							}

							case "issue": {
								if (!vectorStoreQueryServices?.githubIssue) {
									throw new Error(
										"No github issue vector store query service provided",
									);
								}

								const queryContext: GitHubQueryContext = {
									provider: "github" as const,
									workspaceId,
									owner,
									repo,
									contentType: "issue",
									embeddingProfileId,
								};

								const res = await vectorStoreQueryServices.githubIssue.search(
									query,
									queryContext,
									maxResults ?? DEFAULT_MAX_RESULTS,
									similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD,
									async (embeddingMetrics: EmbeddingMetrics) => {
										await context.callbacks?.embeddingComplete?.({
											embeddingMetrics,
											generation: runningGeneration,
											queryContext,
											generationMetadata: metadata,
										});
									},
								);
								return {
									type: "vector-store" as const,
									source,
									records: res.map((result) => ({
										chunkContent: result.chunk.content,
										chunkIndex: result.chunk.index,
										score: result.similarity,
										metadata: Object.fromEntries(
											Object.entries(result.metadata ?? {}).map(([k, v]) => [
												k,
												String(v),
											]),
										),
										additional: result.additional,
									})),
								};
							}

							default: {
								const _exhaustiveCheck: never = contentType;
								throw new Error(
									`Unsupported vector store content type: ${_exhaustiveCheck}`,
								);
							}
						}
					}

					case "document": {
						if (!vectorStoreQueryServices?.document) {
							throw new Error(
								"No document vector store query service provided",
							);
						}

						const embeddingProfileId =
							state.embeddingProfileId ?? DEFAULT_EMBEDDING_PROFILE_ID;
						const queryContext: DocumentVectorStoreQueryContext = {
							provider: "document",
							workspaceId,
							documentVectorStoreId: state.documentVectorStoreId,
							embeddingProfileId,
						};

						const res = await vectorStoreQueryServices.document.search(
							query,
							queryContext,
							maxResults ?? DEFAULT_MAX_RESULTS,
							similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD,
							async (embeddingMetrics: EmbeddingMetrics) => {
								await context.callbacks?.embeddingComplete?.({
									embeddingMetrics,
									generation: runningGeneration,
									queryContext,
									generationMetadata: metadata,
								});
							},
						);
						return {
							type: "vector-store" as const,
							source,
							records: res.map((result) => ({
								chunkContent: result.chunk.content,
								chunkIndex: result.chunk.index,
								score: result.similarity,
								metadata: Object.fromEntries(
									Object.entries(result.metadata ?? {}).map(([key, value]) => [
										key,
										String(value),
									]),
								),
								additional: result.additional,
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
