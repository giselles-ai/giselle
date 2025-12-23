import { defaultName } from "@giselles-ai/node-registry";
import {
	type AppId,
	ConnectionId,
	type CreatedGeneration,
	GenerationContextInput,
	GenerationId,
	GenerationOrigin,
	isAppEntryNode,
	isEndNode,
	isOperationNode,
	isTriggerNode,
	Node,
	NodeId,
	type Sequence,
	SequenceId,
	type Step,
	StepId,
	Task,
	TaskId,
	TaskIndexObject,
	type TaskStarter,
	Workspace,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { findNodeGroupByNodeId } from "@giselles-ai/workspace-utils";
import * as z from "zod/v4";
import { setGeneration } from "../generations";
import { taskPath, workspaceTaskPath } from "../path";
import type { GiselleContext } from "../types";
import { buildLevels } from "../utils/build-levels";
import { addWorkspaceIndexItem } from "../utils/workspace-index";
import { getWorkspace } from "../workspaces";

export const CreateTaskInputs = z.object({
	workspaceId: z.optional(WorkspaceId.schema),
	workspace: z.optional(Workspace),
	connectionIds: z.optional(z.array(ConnectionId.schema)),
	nodeId: z.optional(NodeId.schema),
	inputs: z.array(GenerationContextInput),
	generationOriginType: z.enum(
		GenerationOrigin.options.map((option) => option.shape.type.value),
	),
});
export type CreateTaskInputs = z.infer<typeof CreateTaskInputs>;

export type OnTaskCreate = (event: { task: Task }) => Promise<void> | void;

export async function createTask(
	args: CreateTaskInputs & { context: GiselleContext; onCreate?: OnTaskCreate },
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

	let endNodeId: NodeId | undefined;
	for (const node of nodes) {
		if (!isEndNode(node)) {
			continue;
		}
		if (endNodeId !== undefined) {
			throw new Error(
				`Workspace ${workspace.id} has multiple end nodes: ${endNodeId}, ${node.id}`,
			);
		}
		endNodeId = node.id;
	}
	const nodeIdsConnectedToEnd = Array.from(
		new Set(
			connections
				.filter(
					(connection) =>
						endNodeId !== undefined && connection.inputNode.id === endNodeId,
				)
				.map((connection) => connection.outputNode.id),
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
		throw new Error("Start node is unconfigured");
	}

	const taskId = TaskId.generate();
	const levels = buildLevels(nodes, connections);

	const generations: CreatedGeneration[] = [];
	const sequences: Sequence[] = [];
	for (const level of levels) {
		const steps: Step[] = [];
		for (const nodeId of level) {
			const node = nodes.find((node) => node.id === nodeId);
			// Exclusion conditions: Skip nodes that are:
			// - undefined (not found)
			// - not operation nodes
			// - start nodes (starting points)
			// - end nodes (termination points)
			if (
				node === undefined ||
				!isOperationNode(node) ||
				isAppEntryNode(node) ||
				isEndNode(node)
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
						taskId,
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

	let starter: TaskStarter | undefined;

	switch (args.generationOriginType) {
		case "studio":
			starter = {
				type: "run-button",
			};
			break;
		case "github-app": {
			if (!isTriggerNode(starterNode)) {
				throw new Error("starterNode must be a trigger node");
			}
			if (starterNode.content.provider !== "github") {
				throw new Error("starterNode must be a GitHub trigger node");
			}
			if (starterNode.content.state.status === "unconfigured") {
				throw new Error("starterNode must be configured");
			}

			let appId: AppId | undefined;
			for (const node of workspace.nodes) {
				if (!isAppEntryNode(node)) {
					continue;
				}
				if (node.content.status === "unconfigured") {
					continue;
				}
				if (appId !== undefined) {
					throw new Error(
						`Workspace ${workspace.id} has multiple configured app: ${appId}`,
					);
				}
				appId = node.content.appId;
			}
			starter = {
				type: "github-trigger",
				triggerId: starterNode.content.state.flowTriggerId,
				end:
					endNodeId === undefined || appId === undefined
						? { type: "none" }
						: {
								type: "endNode",
								appId,
							},
			};
			break;
		}
		case "stage":
			if (!isAppEntryNode(starterNode)) {
				throw new Error("starterNode must be an start node");
			}
			if (starterNode.content.status === "unconfigured") {
				throw new Error("starterNode must be configured");
			}
			starter = {
				type: "app",
				appId: starterNode.content.appId,
			};
			break;
		default: {
			const _exhaustiveCheck: never = args.generationOriginType;
			throw new Error(`Unhandled generation origin type: ${_exhaustiveCheck}`);
		}
	}

	const task: Task = {
		id: taskId,
		starter,
		workspaceId: workspace.id,
		status: "created",
		name: starterNode ? defaultName(starterNode) : "group-nodes",
		nodeIdsConnectedToEnd,
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
	args.context.logger.debug(`created task:${task.id}`);
	await Promise.all([
		args.context.storage.setJson({
			path: taskPath(task.id),
			data: task,
			schema: Task,
		}),
		addWorkspaceIndexItem({
			context: args.context,
			indexPath: workspaceTaskPath(workspace.id),
			item: task,
			itemSchema: TaskIndexObject,
		}),
		...generations.map((generation) =>
			setGeneration({
				context: args.context,
				generation,
			}),
		),
		args.onCreate?.({ task }),
	]);
	return { task, generations };
}
