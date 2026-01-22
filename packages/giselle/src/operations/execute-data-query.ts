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
	OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	Secret,
	SecretId,
	type TaskId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import {
	isJsonContent,
	jsonContentToPlainText,
} from "@giselles-ai/text-editor-utils";
import { Client, type QueryResult } from "pg";
import { getDataStore } from "../data-stores/get-data-store";
import { DataQueryError } from "../error";
import type { AppEntryResolver, GenerationMetadata } from "../generations";
import { getTaskGenerationIndexes } from "../generations/internal/get-task-generation-indexes";
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
			appEntryResolver,
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
					appEntryResolver,
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

				const client = new Client({
					connectionString,
					connectionTimeoutMillis: 10000,
					query_timeout: 60000,
				});

				let result: QueryResult;
				try {
					await client.connect();
					result = await client.query(query);
				} catch (error) {
					throw new DataQueryError(
						error instanceof Error ? error.message : String(error),
					);
				} finally {
					await client.end();
				}

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
	appEntryResolver: AppEntryResolver,
): Promise<string> {
	const generationContext = GenerationContext.parse(runningGeneration.context);
	const taskId = runningGeneration.context.origin.taskId;

	async function findGenerationByNode(nodeId: NodeId) {
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			storage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			return undefined;
		}
		return await getGeneration({
			storage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		});
	}

	async function findGenerationByTask(nodeId: NodeId, taskId: TaskId) {
		const taskGenerationIndexes = await getTaskGenerationIndexes({
			storage,
			taskId,
		});
		const targetGenerationIndex = taskGenerationIndexes?.find(
			(index) => index.nodeId === nodeId,
		);
		if (targetGenerationIndex === undefined) {
			return undefined;
		}
		return await getGeneration({
			storage,
			generationId: targetGenerationIndex.id,
		});
	}

	function findGeneration(nodeId: NodeId) {
		if (taskId === undefined) {
			return findGenerationByNode(nodeId);
		}
		return findGenerationByTask(nodeId, taskId);
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

	async function generationContentResolver(
		nodeId: NodeId,
		outputId: OutputId,
	): Promise<string | undefined> {
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
					? jsonContentToPlainText(JSON.parse(jsonOrText))
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
				// LLM often outputs SQL wrapped in markdown code blocks (```sql...```),
				// which would cause syntax errors when executed.
				const content = stripCodeBlock(result ?? "");
				resolvedQuery = resolvedQuery.replace(replaceKeyword, content);
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
			case "appEntry": {
				const messageParts = await appEntryResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				const textParts = messageParts.filter((p) => p.type === "text");
				const text = textParts.map((p) => p.text).join(" ");
				resolvedQuery = resolvedQuery.replace(replaceKeyword, text);
				break;
			}
			case "end": {
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

/**
 * Remove markdown code block syntax from text.
 * Handles ```sql ... ```, ```...```, etc.
 */
function stripCodeBlock(text: string): string {
	const codeBlockPattern = /^```(?:\w+)?\s*([\s\S]*?)\s*```$/;
	const match = text.trim().match(codeBlockPattern);
	return match ? match[1] : text;
}
