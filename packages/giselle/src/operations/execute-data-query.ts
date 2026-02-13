import { parseConfiguration } from "@giselles-ai/data-store-registry";
import {
	type DataStoreId,
	type FailedGeneration,
	GenerationContext,
	type GenerationId,
	type GenerationOutput,
	isCancelledGeneration as isCancelled,
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
import { Pool, type PoolClient, type QueryResult } from "pg";
import { getDataStore } from "../data-stores/get-data-store";
import { DataQueryError } from "../error";
import type { AppEntryResolver, GenerationMetadata } from "../generations";
import { getTaskGenerationIndexes } from "../generations/internal/get-task-generation-indexes";
import { useGenerationExecutor } from "../generations/internal/use-generation-executor";
import { getGeneration, getNodeGenerationIndexes } from "../generations/utils";
import { secretPath } from "../secrets/paths";
import type { GiselleContext } from "../types";

/**
 * Check if a generation has been cancelled by the user.
 */
async function isCancelledGeneration(
	generationId: GenerationId,
	storage: GiselleStorage,
) {
	const generation = await getGeneration({ storage, generationId });
	return isCancelled(generation);
}

/**
 * Creates a query executor that polls for cancellation while executing queries.
 * Encapsulates connection management, PID tracking, and cancellation polling.
 */
function createPollingQueryExecutor({
	pool,
	generationId,
	storage,
	logger,
	dataStoreId,
}: {
	pool: Pool;
	generationId: GenerationId;
	storage: GiselleStorage;
	logger: { warn: (message: string) => void };
	dataStoreId: DataStoreId;
}) {
	let client: PoolClient | null = null;
	let polling = true;

	/**
	 * Executes a SQL query while polling for cancellation.
	 */
	const execute = async (
		query: string,
		values: unknown[],
	): Promise<QueryResult> => {
		client = await pool.connect();

		const pidResult = await client.query("SELECT pg_backend_pid()");
		const pid = pidResult.rows[0].pg_backend_pid;

		const poll = async () => {
			if (!polling) return;
			try {
				const cancelled = await isCancelledGeneration(generationId, storage);
				if (cancelled) {
					await pool.query("SELECT pg_cancel_backend($1)", [pid]);
					polling = false;
					return;
				}
			} catch {
				// Ignore errors (storage access, pg_cancel_backend failure, etc.)
			}
			if (polling) {
				setTimeout(poll, 2500);
			}
		};
		poll();

		// When executing multiple statements (e.g., "SELECT 1; SELECT 2"),
		// pg returns an array of QueryResult objects. Use the last result.
		const queryResult = await client.query(query, values);
		return Array.isArray(queryResult)
			? queryResult[queryResult.length - 1]
			: queryResult;
	};

	/**
	 * Cleans up resources. Must be called in a finally block.
	 */
	const cleanup = async () => {
		polling = false;

		if (client) {
			client.release();
			client = null;
		}

		try {
			await pool.end();
		} catch {
			logger.warn(`Failed to close pool for data store: ${dataStoreId}`);
		}
	};

	return { execute, cleanup };
}

export function executeDataQuery(args: {
	context: GiselleContext;
	generation: QueuedGeneration | RunningGeneration;
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

				const { parameterizedQuery, displayQuery, values } = await resolveQuery(
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
					throw new Error("No Data Store node connected to Data Query node");
				}
				if (connectedDataStoreNode.content.state.status !== "configured") {
					throw new Error("Data Store node is not configured");
				}

				const dataStoreId = connectedDataStoreNode.content.state.dataStoreId;
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

				const secretId = SecretId.parse(config.connectionStringSecretId);
				const secret = await args.context.storage.getJson({
					path: secretPath(secretId),
					schema: Secret,
				});
				const connectionString = await args.context.vault.decrypt(secret.value);

				if (
					await isCancelledGeneration(
						runningGeneration.id,
						args.context.storage,
					)
				) {
					return;
				}

				const pool = new Pool({
					connectionString,
					connectionTimeoutMillis: 10000,
					query_timeout: 65000,
					statement_timeout: 60000,
				});

				const executor = createPollingQueryExecutor({
					pool,
					generationId: runningGeneration.id,
					storage: args.context.storage,
					logger: args.context.logger,
					dataStoreId,
				});

				let result: QueryResult;
				try {
					result = await executor.execute(parameterizedQuery, values);
				} catch (error) {
					// PostgreSQL error code 57014 = query_canceled (user cancel or statement_timeout)
					if (
						error instanceof Error &&
						"code" in error &&
						error.code === "57014"
					) {
						// Check if this was a user-initiated cancellation
						const cancelled = await isCancelledGeneration(
							runningGeneration.id,
							args.context.storage,
						);
						if (cancelled) {
							return;
						}
						// Not user-initiated (e.g., statement_timeout) - treat as error
					}

					throw new DataQueryError(
						error instanceof Error ? error.message : String(error),
					);
				} finally {
					await executor.cleanup();
				}

				if (
					await isCancelledGeneration(
						runningGeneration.id,
						args.context.storage,
					)
				) {
					return;
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
							query: displayQuery,
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

interface ResolvedQuery {
	/** Parameterized query for safe execution (e.g., "SELECT * FROM users WHERE id = $1") */
	parameterizedQuery: string;
	/** Display query with actual values substituted (e.g., "SELECT * FROM users WHERE id = '1'") */
	displayQuery: string;
	/** Parameter values for parameterized query execution */
	values: string[];
}

/**
 * Helper for building parameterized SQL queries
 * Automatically tracks parameter indices and builds the values array
 * Reuses the same parameter index for the same placeholder key
 */
function createParamHelper() {
	const values: string[] = [];
	const placeholderMap = new Map<string, string>();

	return {
		add(key: string, value: string): string {
			// Reuse the same parameter index for the same placeholder key
			const existing = placeholderMap.get(key);
			if (existing !== undefined) {
				return existing;
			}
			values.push(value);
			const placeholder = `$${values.length}`;
			placeholderMap.set(key, placeholder);
			return placeholder;
		},
		values() {
			return values;
		},
	};
}

interface ReplaceKeywordValue {
	/** Replace keyword in the format {{nodeId:outputId}} */
	replaceKeyword: string;
	/** Resolved value to substitute */
	value: string;
}

/**
 * Parameterizes a SQL query by replacing keywords with SQL placeholders ($1, $2, etc.).
 * This is a pure function that handles the conversion logic without any I/O.
 *
 * @param query - The SQL query with replace keywords like {{nodeId:outputId}}
 * @param replaceKeywordValues - Array of keyword-value pairs to substitute
 * @returns ResolvedQuery with parameterizedQuery, displayQuery, and values
 */
export function parameterizeQuery(
	query: string,
	replaceKeywordValues: ReplaceKeywordValue[],
): ResolvedQuery {
	const paramHelper = createParamHelper();
	let parameterizedQuery = query;
	let displayQuery = query;

	for (const { replaceKeyword, value } of replaceKeywordValues) {
		const quotedReplaceKeyword = `'${replaceKeyword}'`;
		const placeholder = paramHelper.add(replaceKeyword, value);

		// Parameterized query: replace with $1, $2, etc.
		// Handle quoted keyword: '{{...}}' → $1 (removes surrounding quotes)
		parameterizedQuery = parameterizedQuery.replaceAll(
			quotedReplaceKeyword,
			placeholder,
		);
		// Handle unquoted keyword: {{...}} → $1
		parameterizedQuery = parameterizedQuery.replaceAll(
			replaceKeyword,
			placeholder,
		);

		// Display query: replace with actual value
		// Use arrow function to avoid special replacement patterns ($&, $', $`, $$)
		displayQuery = displayQuery.replaceAll(replaceKeyword, () => value);
	}

	return {
		parameterizedQuery,
		displayQuery,
		values: paramHelper.values(),
	};
}

async function resolveQuery(
	query: string,
	runningGeneration: RunningGeneration,
	storage: GiselleStorage,
	appEntryResolver: AppEntryResolver,
): Promise<ResolvedQuery> {
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

	const baseQuery = isJsonContent(query)
		? jsonContentToPlainText(JSON.parse(query))
		: query;

	// Find all references in the format {{nd-XXXX:otp-XXXX}}
	const pattern = /\{\{(nd-[a-zA-Z0-9]+):(otp-[a-zA-Z0-9]+)\}\}/g;
	const sourceKeywords = [...baseQuery.matchAll(pattern)].map((match) => ({
		nodeId: NodeId.parse(match[1]),
		outputId: OutputId.parse(match[2]),
	}));

	// Collect values for parameterization (user-controlled inputs)
	const replaceKeywordValues: ReplaceKeywordValue[] = [];
	// Collect direct replacements for LLM-generated SQL (not parameterized)
	const directReplacements: ReplaceKeywordValue[] = [];

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
				replaceKeywordValues.push({ replaceKeyword, value: text });
				break;
			}
			case "textGeneration":
			case "contentGeneration": {
				// LLM-generated content is treated as executable SQL, not parameterized.
				// This allows use cases where LLM generates complete SQL queries.
				// Note: This means prompt injection could potentially affect the generated SQL,
				// but parameterizing would break legitimate use cases where LLM outputs full queries.
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// LLM often outputs SQL wrapped in markdown code blocks (```sql...```),
				// which would cause syntax errors when executed.
				const content = stripCodeBlock(result ?? "");
				directReplacements.push({ replaceKeyword, value: content });
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
				replaceKeywordValues.push({ replaceKeyword, value: result ?? "" });
				break;
			}
			case "appEntry": {
				const messageParts = await appEntryResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				const textParts = messageParts.filter((p) => p.type === "text");
				const text = textParts.map((p) => p.text).join(" ");
				replaceKeywordValues.push({ replaceKeyword, value: text });
				break;
			}
			case "end": {
				replaceKeywordValues.push({ replaceKeyword, value: "" });
				break;
			}
			default: {
				const _exhaustiveCheck: never = contextNode.content;
				throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
			}
		}
	}

	// Apply direct replacements first (LLM-generated SQL)
	let processedQuery = baseQuery;
	for (const { replaceKeyword, value } of directReplacements) {
		// Use arrow function to avoid special replacement patterns ($&, $', $`, $$)
		processedQuery = processedQuery.replaceAll(replaceKeyword, () => value);
	}

	// Then parameterize user-controlled inputs
	return parameterizeQuery(processedQuery, replaceKeywordValues);
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
