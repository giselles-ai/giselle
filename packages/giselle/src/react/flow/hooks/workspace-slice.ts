import {
	type Connection,
	ConnectionId,
	type FileData,
	type FileNode,
	type InputId,
	type Node,
	type NodeBase,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type OutputId,
	type ShortcutScope,
	type Viewport,
	type Workspace,
} from "@giselle-sdk/data-type";
import type { StateCreator } from "zustand";
import { nodeFactories } from "../../../utils";
import type { ConnectionCloneStrategy } from "../types";
import { isSupportedConnection } from "../utils";

const DEFAULT_CONNECTION_CLONE_STRATEGY: ConnectionCloneStrategy =
	"inputs-only";

export interface WorkspaceSlice {
	workspace: Workspace | null;
	_skipNextSave?: boolean;
	initWorkspace: (workspace: Workspace) => void;
	addNode: (node: NodeLike, ui?: NodeUIState) => void;
	updateNode: (nodeId: NodeId, data: Partial<NodeBase>) => void;
	deleteNode: (nodeId: NodeId | string) => void;
	addConnection: (args: {
		outputNode: NodeLike;
		outputId: OutputId;
		inputNode: NodeLike;
		inputId: InputId;
	}) => void;
	deleteConnection: (connectionId: ConnectionId) => void;
	copyNode: (
		sourceNode: Node,
		options?: {
			ui?: NodeUIState;
			connectionCloneStrategy?: ConnectionCloneStrategy;
		},
	) => Node | undefined;
	setUiNodeState: (
		nodeId: NodeId | string,
		ui: Partial<NodeUIState>,
		options?: { save?: boolean },
	) => void;
	setUiViewport: (viewport: Viewport, options?: { save?: boolean }) => void;
	setCurrentShortcutScope: (
		scope: ShortcutScope,
		options?: { save?: boolean },
	) => void;
	updateWorkspaceName: (name: string | undefined) => void;
	updateNodeData: <T extends NodeBase>(node: T, data: Partial<T>) => void;
	updateNodeDataContent: <T extends Node>(
		node: T,
		content: Partial<T["content"]>,
	) => void;
	updateFileStatus: (nodeId: NodeId, files: FileData[]) => void;
}

export const createWorkspaceSlice: StateCreator<
	WorkspaceSlice,
	[],
	[],
	WorkspaceSlice
> = (set, get) => ({
	workspace: null,
	_skipNextSave: false,
	initWorkspace: (workspace) => set({ workspace }),
	addNode: (node, ui) =>
		set((state) => {
			if (!state.workspace) return {};
			const newUi = { ...state.workspace.ui };
			if (ui) {
				newUi.nodeState = { ...newUi.nodeState, [node.id]: ui };
			}
			return {
				workspace: {
					...state.workspace,
					nodes: [...state.workspace.nodes, node],
					ui: newUi,
				},
			};
		}),
	updateNode: (nodeId, data) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				workspace: {
					...state.workspace,
					nodes: state.workspace.nodes.map((n) =>
						n.id === nodeId ? ({ ...n, ...data } as NodeLike) : n,
					),
				},
			};
		}),
	deleteNode: (nodeIdToDelete) =>
		set((state) => {
			if (!state.workspace) return {};
			const nodeId = NodeId.parse(nodeIdToDelete);
			const ui = {
				...state.workspace.ui,
				nodeState: { ...state.workspace.ui.nodeState },
			};
			delete ui.nodeState[nodeId];
			return {
				workspace: {
					...state.workspace,
					nodes: state.workspace.nodes.filter((n) => n.id !== nodeId),
					ui,
				},
			};
		}),
	addConnection: ({ outputNode, outputId, inputNode, inputId }) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				workspace: {
					...state.workspace,
					connections: [
						...state.workspace.connections,
						{
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
						} as Connection,
					],
				},
			};
		}),
	deleteConnection: (connectionId) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				workspace: {
					...state.workspace,
					connections: state.workspace.connections.filter(
						(c) => c.id !== connectionId,
					),
				},
			};
		}),
	copyNode: (sourceNode, options) => {
		const { workspace } = get();
		if (!workspace) return;

		const { newNode, inputIdMap, outputIdMap } =
			nodeFactories.clone(sourceNode);
		get().addNode(newNode, options?.ui);

		const strategy =
			options?.connectionCloneStrategy ?? DEFAULT_CONNECTION_CLONE_STRATEGY;

		for (const originalConnection of workspace.connections) {
			if (
				originalConnection.inputNode.id === sourceNode.id &&
				(strategy === "all" || strategy === "inputs-only")
			) {
				const outputNode = workspace.nodes.find(
					(n) => n.id === originalConnection.outputNode.id,
				);
				const newInputId = inputIdMap[originalConnection.inputId];
				if (outputNode && newInputId) {
					const connectionExists = get().workspace?.connections.some(
						(c) =>
							c.outputNode.id === outputNode.id &&
							c.outputId === originalConnection.outputId &&
							c.inputNode.id === newNode.id &&
							c.inputId === newInputId,
					);
					const connectionValid = isSupportedConnection(
						outputNode,
						newNode,
					).canConnect;
					if (!connectionExists && connectionValid) {
						get().addConnection({
							outputNode,
							outputId: originalConnection.outputId,
							inputNode: newNode,
							inputId: newInputId,
						});
					}
				}
			} else if (
				originalConnection.outputNode.id === sourceNode.id &&
				strategy === "all"
			) {
				const inputNode = workspace.nodes.find(
					(n) => n.id === originalConnection.inputNode.id,
				);
				const newOutputId = outputIdMap[originalConnection.outputId];
				if (inputNode && newOutputId) {
					const connectionExists = get().workspace?.connections.some(
						(c) =>
							c.outputNode.id === newNode.id &&
							c.outputId === newOutputId &&
							c.inputNode.id === inputNode.id &&
							c.inputId === originalConnection.inputId,
					);
					const connectionValid = isSupportedConnection(
						newNode,
						inputNode,
					).canConnect;
					if (!connectionExists && connectionValid) {
						get().addConnection({
							outputNode: newNode,
							outputId: newOutputId,
							inputNode,
							inputId: originalConnection.inputId,
						});
					}
				}
			}
		}
		return newNode;
	},
	setUiNodeState: (nodeId, ui) =>
		set((state) => {
			if (!state.workspace) return {};
			const parsedNodeId = NodeId.parse(nodeId);
			const nodeState = state.workspace.ui.nodeState[parsedNodeId] ?? {};
			return {
				workspace: {
					...state.workspace,
					ui: {
						...state.workspace.ui,
						nodeState: {
							...state.workspace.ui.nodeState,
							[parsedNodeId]: { ...nodeState, ...ui },
						},
					},
				},
			};
		}),
	setUiViewport: (viewport, options) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				_skipNextSave: !options?.save,
				workspace: {
					...state.workspace,
					ui: { ...state.workspace.ui, viewport: viewport },
				},
			};
		}),
	setCurrentShortcutScope: (scope, options) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				_skipNextSave: !options?.save,
				workspace: {
					...state.workspace,
					ui: { ...state.workspace.ui, currentShortcutScope: scope },
				},
			};
		}),
	updateWorkspaceName: (name) =>
		set((state) => {
			if (!state.workspace) return {};
			return { workspace: { ...state.workspace, name: name } };
		}),
	updateNodeData: (node, data) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				workspace: {
					...state.workspace,
					nodes: state.workspace.nodes.map((n) =>
						n.id === node.id
							? ({
									...n,
									...data,
								} as NodeLike)
							: n,
					),
				},
			};
		}),
	updateNodeDataContent: (node, content) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				workspace: {
					...state.workspace,
					nodes: state.workspace.nodes.map((n) =>
						n.id === node.id
							? ({
									...n,
									content: { ...n.content, ...content },
								} as NodeLike)
							: n,
					),
				},
			};
		}),
	updateFileStatus: (nodeId, files) =>
		set((state) => {
			if (!state.workspace) return {};
			return {
				workspace: {
					...state.workspace,
					nodes: state.workspace.nodes.map((n) =>
						n.id === nodeId
							? ({
									...n,
									content: { ...(n as FileNode).content, files: files },
								} as NodeLike)
							: n,
					),
				},
			};
		}),
});
