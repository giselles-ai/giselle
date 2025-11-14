import { defaultName } from "@giselles-ai/node-registry";
import {
	Act,
	ActId,
	ActIndexObject,
	ConnectionId,
	type CreatedGeneration,
	GenerationContextInput,
	GenerationId,
	GenerationOrigin,
	isAppEntryNode,
	isOperationNode,
	isTriggerNode,
	Node,
	NodeId,
	type Sequence,
	SequenceId,
	type Step,
	StepId,
	Workspace,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { z } from "zod/v4";
import { setGeneration } from "../generations";
import type { GiselleEngineContext } from "../types";
import { buildLevels } from "../utils/build-levels";
import { findNodeGroupByNodeId } from "../utils/workspace/group-nodes";
import { addWorkspaceIndexItem } from "../utils/workspace-index";
import { getWorkspace } from "../workspaces";
import { actPath, workspaceActPath } from "./object/paths";

export const CreateActInputs = z.object({
	workspaceId: z.optional(WorkspaceId.schema),
	workspace: z.optional(Workspace),
	connectionIds: z.optional(z.array(ConnectionId.schema)),
	nodeId: z.optional(NodeId.schema),
	inputs: z.array(GenerationContextInput),
	generationOriginType: z.enum(
		GenerationOrigin.options.map((option) => option.shape.type.value),
	),
});
export type CreateActInputs = z.infer<typeof CreateActInputs>;

export async function createAct(
	args: CreateActInputs & { context: GiselleEngineContext },
) {
	let workspace: Workspace | undefined = args.workspace;

	if (args.workspaceId !== undefined) {
		workspace = await getWorkspace({
			...args,
			workspaceId: args.workspaceId,
		});
	}
	if (workspace === undefined) {
		throw new Error("workspace or workspaceId is required");
	}

	// Determine connectionIds based on input
	let connectionIds: ConnectionId[];
	if (args.connectionIds !== undefined) {
		// Use provided connectionIds directly
		connectionIds = args.connectionIds;
	} else if (args.nodeId !== undefined) {
		// Derive connectionIds from nodeId using node groups
		const nodeGroup = findNodeGroupByNodeId(workspace, args.nodeId);

		if (!nodeGroup) {
			throw new Error(`Node ${args.nodeId} is not part of any node group`);
		}
		connectionIds = nodeGroup.connectionIds;
	} else {
		// This should not happen due to schema validation, but adding for safety
		throw new Error("Either connectionIds or nodeId must be provided");
	}

	const connections = workspace.connections.filter((connection) =>
		connectionIds.includes(connection.id),
	);
	const nodes = workspace.nodes.filter((node) =>
		connections.some(
			(connection) =>
				connection.inputNode.id === node.id ||
				connection.outputNode.id === node.id,
		),
	);

	// Handle single operation node execution when no connections are found
	if (nodes.length === 0 && args.nodeId !== undefined) {
		const singleNode = workspace.nodes.find((node) => node.id === args.nodeId);
		if (singleNode && isOperationNode(singleNode)) {
			nodes.push(singleNode);
		}
	}

	const starterNode = nodes.find(
		(node) => isTriggerNode(node) || isAppEntryNode(node),
	);

	if (
		starterNode?.content.type === "appEntry" &&
		starterNode?.content.status === "unconfigured"
	) {
		throw new Error("App entry node is unconfigured");
	}

	const actId = ActId.generate();
	const levels = buildLevels(nodes, connections);

	const generations: CreatedGeneration[] = [];
	const sequences: Sequence[] = [];
	for (const level of levels) {
		const steps: Step[] = [];
		for (const nodeId of level) {
			const node = nodes.find((node) => node.id === nodeId);
			if (
				node === undefined ||
				!isOperationNode(node) ||
				isAppEntryNode(node)
			) {
				continue;
			}
			const connectedConnections = connections.filter(
				(connection) => connection.inputNode.id === nodeId,
			);

			// Map through each input to find source nodes, preserving duplicates
			const sourceNodes = node.inputs
				.map((input) => {
					// Find connections for this specific input
					const inputConnections = connectedConnections.filter(
						(connection) => connection.inputId === input.id,
					);
					// For each input connection, find the corresponding source node
					if (inputConnections.length > 0) {
						const sourceNodeId = inputConnections[0].outputNode.id;
						const node = nodes.find((n) => n.id === sourceNodeId);
						const parseResult = Node.safeParse(node);
						if (parseResult.success) {
							return parseResult.data;
						}
						return undefined;
					}
					return undefined;
				})
				.filter((node) => node !== undefined);
			const generation: CreatedGeneration = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					origin: {
						type: args.generationOriginType,
						workspaceId: workspace.id,
						actId,
					},
					inputs: args.inputs,
					operationNode: node,
					sourceNodes,
					connections: connectedConnections,
				},
			};
			generations.push(generation);
			steps.push({
				id: StepId.generate(),
				name: node.name ?? defaultName(node),
				status: "created",
				generationId: generation.id,
				duration: 0,
				usage: {
					inputTokens: 0,
					outputTokens: 0,
					totalTokens: 0,
				},
			});
		}
		if (steps.length === 0) {
			continue;
		}
		sequences.push({
			id: SequenceId.generate(),
			status: "created",
			steps,
			duration: {
				wallClock: 0,
				totalTask: 0,
			},
			usage: {
				inputTokens: 0,
				outputTokens: 0,
				totalTokens: 0,
			},
		});
	}

	const act: Act = {
		id: actId,
		workspaceId: workspace.id,
		status: "created",
		name: starterNode ? defaultName(starterNode) : "node-group",
		steps: {
			queued: generations.length,
			inProgress: 0,
			warning: 0,
			completed: 0,
			failed: 0,
			cancelled: 0,
		},
		trigger: "testing",
		duration: {
			wallClock: 0,
			totalTask: 0,
		},
		usage: {
			inputTokens: 0,
			outputTokens: 0,
			totalTokens: 0,
		},
		createdAt: Date.now(),
		updatedAt: Date.now(),
		annotations: [],
		sequences,
	};
	args.context.logger.debug(`created act:${act.id}`);
	await Promise.all([
		args.context.storage.setJson({
			path: actPath(act.id),
			data: act,
			schema: Act,
		}),
		addWorkspaceIndexItem({
			context: args.context,
			indexPath: workspaceActPath(workspace.id),
			item: act,
			itemSchema: ActIndexObject,
		}),
		...generations.map((generation) =>
			setGeneration({
				context: args.context,
				generation,
			}),
		),
	]);
	return { act, generations };
}
