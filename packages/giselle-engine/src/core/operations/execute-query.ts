import {
	type CompletedGeneration,
	type FailedGeneration,
	GenerationContext,
	type GenerationOutput,
	type QueuedGeneration,
	type RunningGeneration,
	type WorkspaceId,
	isQueryNode,
} from "@giselle-sdk/data-type";
import {
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

		const datastoreNodes = generationContext.sourceNodes.filter(
			(node) =>
				node.type === "variable" &&
				node.content.type === "vectorStore" &&
				generationContext.connections.some(
					(connection) => connection.outputNode.id === node.id,
				),
		);

		const query = await resolveQuery(operationNode.content.query);
		const queryResults = await queryVectorStore(query);
		const outputId = initialGeneration.context.operationNode.outputs.find(
			(output) => output.accessor === "result",
		)?.id;
		if (outputId === undefined) {
			throw new Error("query-results output not found in operation node");
		}
		const outputs: GenerationOutput[] = [
			{
				type: "generated-text",
				content: queryResults.join("\n\n"),
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

async function resolveQuery(query: string) {
	// TODO: implement query resolution
	return query;
}

async function queryVectorStore(query: string) {
	// TODO: implement query execution
	return ["hello", "world"];
}
