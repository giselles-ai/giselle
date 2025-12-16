import {
	type Connection,
	ConnectionId,
	type FileData,
	type FileNode,
	type InputId,
	isActionNode,
	isFileNode,
	isOperationNode,
	type Node,
	type NodeBase,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type OutputId,
	type Viewport,
	type Workspace,
} from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { AppDesignerStoreState } from "../app-designer-store";

export interface WorkspaceActions {
	addNode: (node: NodeLike, ui?: NodeUIState) => void;
	updateNode: (nodeId: NodeId | string, data: Partial<NodeBase>) => void;
	deleteNode: (nodeId: NodeId | string) => void;
	addConnection: (args: {
		outputNode: NodeLike;
		outputId: OutputId;
		inputNode: NodeLike;
		inputId: InputId;
	}) => void;
	deleteConnection: (connectionId: string) => void;
	setUiNodeState: (nodeId: NodeId | string, ui: Partial<NodeUIState>) => void;
	setUiViewport: (viewport: Viewport, options?: { save?: boolean }) => void;
	selectConnection: (connectionId: string) => void;
	deselectConnection: (connectionId: string) => void;
	updateNodeData: <T extends NodeLike>(node: T, data: Partial<T>) => void;
	updateNodeDataContent: <T extends Node>(
		node: T,
		content: Partial<T["content"]>,
	) => void;
	updateFileStatus: (
		nodeId: NodeId,
		files: FileData[] | ((files: FileData[]) => FileData[]),
	) => void;
}

export type WorkspaceSlice = Workspace &
	WorkspaceActions & {
		/**
		 * When true, persistence should ignore the next store update and reset this flag.
		 * Useful for UI-only state changes you don't want to persist.
		 */
		_skipNextSave: boolean;
	};

export type WorkspaceSliceCreator = StateCreator<
	AppDesignerStoreState,
	[],
	[],
	WorkspaceSlice
>;

export function createWorkspaceSlice(
	initial: Workspace,
): WorkspaceSliceCreator {
	return (set, get) => ({
		id: initial.id,
		schemaVersion: initial.schemaVersion,
		nodes: initial.nodes,
		connections: initial.connections,
		ui: initial.ui,
		_skipNextSave: false,
		addNode: (node, ui) =>
			set((s) => {
				const nextUi = ui
					? {
							...s.ui,
							nodeState: { ...s.ui.nodeState, [node.id]: ui },
						}
					: s.ui;
				return {
					nodes: [...s.nodes, node],
					ui: nextUi,
				};
			}),
		updateNode: (nodeId, data) =>
			set((s) => ({
				nodes: s.nodes.map((n) =>
					n.id === NodeId.parse(nodeId) ? ({ ...n, ...data } as NodeLike) : n,
				),
			})),
		deleteNode: (nodeIdToDelete) => {
			const nodeId = NodeId.parse(nodeIdToDelete);
			const connectionsToDelete = get().connections.filter(
				(c) => c.inputNode.id === nodeId || c.outputNode.id === nodeId,
			);
			const connectionIdsToDelete = new Set(
				connectionsToDelete.map((c) => c.id),
			);
			set((s) => {
				const ui = { ...s.ui, nodeState: { ...s.ui.nodeState } };
				delete ui.nodeState[nodeId];
				if (ui.selectedConnectionIds) {
					ui.selectedConnectionIds = ui.selectedConnectionIds.filter(
						(id) => !connectionIdsToDelete.has(id),
					);
				}

				const inputsToRemove = new Map(
					s.connections
						.filter((c) => c.outputNode.id === nodeId)
						.map((c) => [c.inputNode.id, c.inputId] as const),
				);

				const nodes = s.nodes
					.filter((n) => n.id !== nodeId)
					.map((n) => {
						const inputIdToRemove = inputsToRemove.get(n.id);
						if (!inputIdToRemove || !isOperationNode(n) || isActionNode(n)) {
							return n;
						}
						return {
							...n,
							inputs: n.inputs.filter((input) => input.id !== inputIdToRemove),
						};
					});

				const connections = s.connections.filter(
					(c) => c.inputNode.id !== nodeId && c.outputNode.id !== nodeId,
				);

				return { nodes, connections, ui };
			});
		},
		addConnection: ({ outputNode, outputId, inputNode, inputId }) => {
			const newConnection = {
				id: ConnectionId.generate(),
				outputNode: {
					id: outputNode.id,
					type: outputNode.type,
					content: { type: outputNode.content.type },
				},
				outputId,
				inputNode: {
					id: inputNode.id,
					type: inputNode.type,
					content: { type: inputNode.content.type },
				},
				inputId,
			} as Connection;

			set((s) => ({ connections: [...s.connections, newConnection] }));
		},
		deleteConnection: (connectionId) => {
			const targetConnection = get().connections.find(
				(c) => c.id === connectionId,
			);
			set((s) => {
				if (targetConnection === undefined) {
					return s;
				}

				const nextConnections = s.connections.filter(
					(c) => c.id !== connectionId,
				);
				const ui = { ...s.ui };
				if (ui.selectedConnectionIds) {
					ui.selectedConnectionIds = ui.selectedConnectionIds.filter(
						(id) => id !== connectionId,
					);
				}

				const targetNode = s.nodes.find(
					(n) => n.id === targetConnection.inputNode.id,
				);
				if (
					targetNode === undefined ||
					!isOperationNode(targetNode) ||
					isActionNode(targetNode)
				) {
					return { connections: nextConnections, ui };
				}

				const updatedInputs = targetNode.inputs.filter(
					(input) => input.id !== targetConnection.inputId,
				);
				const nextNodes = s.nodes.map((n) =>
					n.id === targetNode.id
						? ({ ...n, inputs: updatedInputs } as NodeLike)
						: n,
				);

				return { connections: nextConnections, nodes: nextNodes, ui };
			});
		},
		setUiNodeState: (nodeId, ui) =>
			set((s) => {
				const parsedNodeId = NodeId.parse(nodeId);
				const nodeState = s.ui.nodeState[parsedNodeId] ?? {};
				return {
					ui: {
						...s.ui,
						nodeState: {
							...s.ui.nodeState,
							[parsedNodeId]: { ...nodeState, ...ui },
						},
					},
				};
			}),
		setUiViewport: (viewport, options) =>
			set((s) => ({
				_skipNextSave: !options?.save,
				ui: { ...s.ui, viewport },
			})),
		selectConnection: (connectionId) =>
			set((s) => {
				const connection = s.connections.find((c) => c.id === connectionId);
				if (connection === undefined) {
					return s;
				}
				return {
					ui: {
						...s.ui,
						selectedConnectionIds: [
							...(s.ui.selectedConnectionIds ?? []),
							connection.id,
						],
					},
				};
			}),
		deselectConnection: (connectionId) =>
			set((s) => ({
				ui: {
					...s.ui,
					selectedConnectionIds: (s.ui.selectedConnectionIds ?? []).filter(
						(id) => id !== connectionId,
					),
				},
			})),
		updateNodeData: (node, data) =>
			set((s) => ({
				nodes: s.nodes.map((n) =>
					n.id === node.id ? ({ ...n, ...data } as NodeLike) : n,
				),
			})),
		updateNodeDataContent: (node, content) =>
			set((s) => ({
				nodes: s.nodes.map((n) =>
					n.id === node.id
						? ({ ...n, content: { ...n.content, ...content } } as NodeLike)
						: n,
				),
			})),
		updateFileStatus: (nodeId, filesOrUpdater) =>
			set((s) => ({
				nodes: s.nodes.map((n) => {
					if (n.id !== nodeId) return n;
					if (!isFileNode(n)) return n;

					const currentFiles = (n as FileNode).content.files;
					const newFiles =
						typeof filesOrUpdater === "function"
							? filesOrUpdater(currentFiles)
							: filesOrUpdater;

					return {
						...n,
						content: { ...n.content, files: newFiles },
					} as NodeLike;
				}),
			})),
	});
}
