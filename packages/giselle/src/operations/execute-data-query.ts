import { parseConfiguration } from "@giselles-ai/data-store-registry";
import {
	type FailedGeneration,
	GenerationContext,
	type GenerationOutput,
	isCompletedGeneration,
	isDataQueryNode,
	isDataStoreNode,
	isTextNode,
	NodeId,
	type Output,
	OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	Secret,
	SecretId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import {
	isJsonContent,
	jsonContentToPlainText,
	jsonContentToText,
} from "@giselles-ai/text-editor-utils";
import { Client } from "pg";
import { getDataStore } from "../data-stores/get-data-store";
import type { GenerationMetadata } from "../generations";
import { useGenerationExecutor } from "../generations/internal/use-generation-executor";
import { getGeneration, getNodeGenerationIndexes } from "../generations/utils";
import { secretPath } from "../secrets/paths";
import type { GiselleContext } from "../types";

export function executeDataQuery(args: {
	context: GiselleContext;
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
		}) => {
			try {
				const operationNode = generationContext.operationNode;
				if (!isDataQueryNode(operationNode)) {
					throw new Error("Invalid generation type for executeDataQuery");
				}

				const query = await resolveQuery(
					operationNode.content.query,
					runningGeneration,
					args.context.storage,
				);

				const connectedDataStoreNode = generationContext.sourceNodes
					.filter(isDataStoreNode)
					.find((node) =>
						generationContext.connections.some(
							(connection) => connection.outputNode.id === node.id,
						),
					);
				if (connectedDataStoreNode === undefined) {
					throw new Error("No DataStore node connected to DataQuery node");
				}
				if (connectedDataStoreNode.content.state.status !== "configured") {
					throw new Error("DataStore node is not configured");
				}

				const dataStoreId = connectedDataStoreNode.content.state.dataStoreId;
				const dataStore = await getDataStore({
					context: args.context,
					dataStoreId,
				});
				const config = parseConfiguration(
					dataStore.provider,
					dataStore.configuration,
				);

				const secretId = SecretId.parse(config.connectionStringSecretId);
				const secret = await args.context.storage.getJson({
					path: secretPath(secretId),
					schema: Secret,
				});
				const connectionString = await args.context.vault.decrypt(secret.value);

				const client = new Client({ connectionString });
				try {
					await client.connect();

					const result = await client.query(query);

					const outputId = operationNode.outputs.find(
						(output) => output.accessor === "result",
					)?.id;

					if (outputId === undefined) {
						throw new Error("result output not found in operation node");
					}

					const outputs: GenerationOutput[] = [
						{
							type: "data-query-result",
							outputId,
							content: {
								type: "data-query",
								dataStoreId,
								rows: result.rows,
								rowCount: result.rowCount ?? result.rows.length,
								query,
							},
						},
					];

					await finishGeneration({
						inputMessages: [],
						outputs,
					});
				} finally {
					await client.end();
				}
			} catch (error) {
				const failedGeneration = {
					...runningGeneration,
					status: "failed",
					failedAt: Date.now(),
					error: {
						name: error instanceof Error ? error.name : "UnknownError",
						message: error instanceof Error ? error.message : String(error),
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
): Promise<string> {
	const generationContext = GenerationContext.parse(runningGeneration.context);

	async function generationContentResolver(
		nodeId: NodeId,
		outputId: OutputId,
	): Promise<string | undefined> {
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
				throw new Error("Query result is not supported for Data Query node");
			case "data-query-result":
				throw new Error(
					"Data query result is not supported for Data Query node",
				);
			default: {
				const _exhaustiveCheck: never = generationOutput;
				throw new Error(
					`Unhandled generation output type: ${_exhaustiveCheck}`,
				);
			}
		}
	}

	let resolvedQuery = isJsonContent(query)
		? jsonContentToPlainText(JSON.parse(query))
		: query;

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
			case "textGeneration":
			case "contentGeneration": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				resolvedQuery = resolvedQuery.replace(replaceKeyword, result ?? "");
				break;
			}
			case "file":
			case "webPage":
			case "github":
			case "imageGeneration":
			case "query":
			case "dataQuery":
			case "vectorStore":
			case "dataStore":
				throw new Error(
					`Node type ${contextNode.content.type} is not supported for data query`,
				);

			case "trigger":
			case "action": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				resolvedQuery = resolvedQuery.replace(replaceKeyword, result ?? "");
				break;
			}
			case "end":
			case "appEntry": {
				resolvedQuery = resolvedQuery.replace(replaceKeyword, "");
				break;
			}
			default: {
				const _exhaustiveCheck: never = contextNode.content;
				throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
			}
		}
	}

	return resolvedQuery;
}
