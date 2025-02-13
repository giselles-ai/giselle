import { join } from "node:path";
import { type CreateTextNodeParams, TextNode } from "../node/text";
import { TextGenerationNode } from "../node/text-generation";
import type {
	CreateTextGenerationNodeParams,
	TextGenerationContent,
	TextGenerationNodeData,
} from "../node/text-generation";
import type {
	ConnectionHandle,
	NodeData,
	NodeId,
	NodeServices,
	NodeUIState,
} from "../node/types";
import type { WorkflowData } from "../node/workflow-state";
import type { RuntimeConfiguration } from "../runtime/types";
import { WorkflowRunnerSystem } from "../runtime/workflow-runner-system";
import { createStorageClient } from "../storage/index";
import type { Workflow, WorkflowConfiguration } from "./types";

function isTextGenerationContent(
	content: unknown,
): content is TextGenerationContent {
	return (
		typeof content === "object" &&
		content !== null &&
		"type" in content &&
		content.type === "textGeneration"
	);
}

export function initWorkflow(config: WorkflowConfiguration): Workflow {
	const workflowId = `wf_${Math.random().toString(36)}`;
	const storage = createStorageClient(config.storage);
	let workflowData: WorkflowData = {
		nodes: {},
		connections: [],
		ui: { nodeStates: {} },
		version: "0.0.1",
	};

	function createNodeServices(nodeId: NodeId): NodeServices {
		return {
			addSources: (sourceNodes: NodeData[]) => {
				const nodeContent = workflowData.nodes[nodeId].data.content;
				if (!isTextGenerationContent(nodeContent)) {
					throw new Error("Cannot add sources to non-text-generation node");
				}

				const handles = sourceNodes.map((sourceNode) =>
					addConnection({
						target: workflowData.nodes[nodeId].data,
						targetHandleLabel: "source",
						source: sourceNode,
					}),
				);

				workflowData = {
					...workflowData,
					nodes: {
						...workflowData.nodes,
						[nodeId]: {
							...workflowData.nodes[nodeId],
							data: {
								...workflowData.nodes[nodeId].data,
								content: {
									...nodeContent,
									sources: [...nodeContent.sources, ...handles],
								},
							},
						},
					},
				};
			},
			removeSources: (nodes: NodeData[]) => {
				const nodeContent = workflowData.nodes[nodeId].data.content;
				if (!isTextGenerationContent(nodeContent)) {
					throw new Error(
						"Cannot remove sources from non-text-generation node",
					);
				}

				const connectionsToRemove = workflowData.connections.filter(
					(connection) =>
						connection.targetNodeId === nodeId &&
						nodes.some((n) => n.id === connection.sourceNodeId),
				);
				const connectionIdsToRemove = new Set(
					connectionsToRemove.map((c) => c.id),
				);
				const nodeHandleIdsToRemove = new Set(
					connectionsToRemove.map((c) => c.targetNodeHandleId),
				);

				workflowData = {
					...workflowData,
					connections: workflowData.connections.filter(
						(connection) => !connectionIdsToRemove.has(connection.id),
					),
					nodes: {
						...workflowData.nodes,
						[nodeId]: {
							...workflowData.nodes[nodeId],
							data: {
								...workflowData.nodes[nodeId].data,
								content: {
									...nodeContent,
									sources: nodeContent.sources.filter(
										(source: ConnectionHandle) =>
											!nodeHandleIdsToRemove.has(source.id),
									),
								},
							},
						},
					},
				};
			},
		};
	}

	function addConnection({
		source,
		target,
		targetHandleLabel,
	}: {
		source: NodeData;
		target: NodeData;
		targetHandleLabel: string;
	}): ConnectionHandle {
		const connectionHandle: ConnectionHandle = {
			id: `hndl_${Math.random().toString(36)}`,
			connectedSourceNodeId: source.id,
			connectedTargetNodeId: target.id,
			label: targetHandleLabel,
		};
		workflowData = {
			...workflowData,
			connections: [
				...workflowData.connections,
				{
					id: `cnnc_${Math.random().toString(36)}`,
					sourceNodeId: source.id,
					sourceNodeType: source.type,
					targetNodeId: target.id,
					targetNodeType: target.type,
					targetNodeHandleId: connectionHandle.id,
				},
			],
		};
		return connectionHandle;
	}

	function createTextGenerationNode({
		params,
		options,
	}: {
		params: CreateTextGenerationNodeParams;
		options?: { ui: NodeUIState };
	}): TextGenerationNode {
		const nodeId = `nd_${Math.random().toString(36)}` as const;
		const nodeData = {
			id: nodeId,
			name: params.name,
			type: "action",
			content: {
				type: "textGeneration",
				llm: params.llm,
				temperature: params.temperature,
				topP: params.topP,
				requirement: undefined,
				instruction: params.instruction,
				system: params.system,
				sources: [],
			},
		} as NodeData;

		workflowData = {
			...workflowData,
			nodes: {
				...workflowData.nodes,
				[nodeId]: { data: nodeData },
			},
			ui: {
				...workflowData.ui,
				nodeStates: {
					...workflowData.ui.nodeStates,
					...(options?.ui && { [nodeId]: options.ui }),
				},
			},
		};

		return new TextGenerationNode(
			nodeId,
			workflowData,
			createNodeServices(nodeId),
		);
	}

	function createTextNode({
		params,
		options,
	}: {
		params: CreateTextNodeParams;
		options?: { ui: NodeUIState };
	}): TextNode {
		const nodeId = `nd_${Math.random().toString(36)}` as const;
		const nodeData = {
			id: nodeId,
			name: params.name,
			type: "variable",
			content: {
				type: "text",
				text: params.text,
			},
		} as NodeData;

		workflowData = {
			...workflowData,
			nodes: {
				...workflowData.nodes,
				[nodeId]: { data: nodeData },
			},
			ui: {
				...workflowData.ui,
				nodeStates: {
					...workflowData.ui.nodeStates,
					...(options?.ui && { [nodeId]: options.ui }),
				},
			},
		};

		return new TextNode(nodeId, workflowData);
	}

	function workflowJsonPath(): string {
		return join(config.storage.directory ?? "", `${workflowId}.json`);
	}

	return {
		id: workflowId,
		addTextGenerationNode: (params, options) => {
			return createTextGenerationNode({ params, options });
		},
		addTextNode: (params, options) => {
			return createTextNode({ params, options });
		},

		load: async (workflowId: string) => {
			const data = await storage.get(workflowJsonPath());

			if (!data) {
				throw new Error(`Workflow ${workflowId} not found`);
			}

			const loadedData = JSON.parse(data) as WorkflowData;
			workflowData = loadedData;

			return Object.fromEntries(
				Object.entries(workflowData.nodes)
					.filter(([, node]) => isTextGenerationContent(node.data.content))
					.map(([id]) => [
						id,
						new TextGenerationNode(
							id as NodeId,
							workflowData,
							createNodeServices(id as NodeId),
						),
					]),
			);
		},

		save: async () => {
			await storage.put(workflowJsonPath(), JSON.stringify(workflowData));
		},

		getNode: (nodeId: NodeId): TextGenerationNodeData | undefined => {
			if (workflowData.nodes[nodeId]) {
				const node = workflowData.nodes[nodeId].data;
				if (isTextGenerationContent(node.content)) {
					return new TextGenerationNode(
						nodeId,
						workflowData,
						createNodeServices(nodeId),
					);
				}
			}
			return undefined;
		},

		run: async (runtimeConfig?: RuntimeConfiguration) => {
			const runner = new WorkflowRunnerSystem(workflowData, runtimeConfig);
			return await runner.run();
		},
	};
}
