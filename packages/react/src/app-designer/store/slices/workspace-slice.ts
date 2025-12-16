import {
	type Connection,
	type ConnectionId,
	type Node,
	NodeId,
	type NodeUIState,
	type Workspace,
} from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { AppDesignerStoreState } from "../app-designer-store";

export interface WorkspaceActions {
	addNode: (node: Node) => void;
	addConnection: (connection: Connection) => void;
	removeNode: (id: NodeId) => void;
	removeConnection: (id: ConnectionId) => void;
	upsertNodeUiState: (maybeNodeId: string, nodeUiState: NodeUIState) => void;
}

export type WorkspaceSlice = Workspace & WorkspaceActions;

export type WorkspaceSliceCreator = StateCreator<
	AppDesignerStoreState,
	[],
	[],
	WorkspaceSlice
>;

export function createWorkspaceSlice(
	initial: Workspace,
): WorkspaceSliceCreator {
	return (set) => ({
		id: initial.id,
		schemaVersion: initial.schemaVersion,
		nodes: initial.nodes,
		connections: initial.connections,
		ui: initial.ui,
		addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
		addConnection: (connection) =>
			set((s) => ({ connections: [...s.connections, connection] })),
		removeNode: (id) =>
			set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),
		removeConnection: (id) =>
			set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),
		upsertNodeUiState: (maybeNodeId, nodeUiState) =>
			set((s) => {
				const parsedNodeId = NodeId.parse(maybeNodeId);
				const nodeState = s.ui.nodeState[parsedNodeId] ?? {};
				return {
					...s,
					ui: {
						...s.ui,
						nodeState: {
							...s.ui.nodeState,
							[parsedNodeId]: { ...nodeState, ...nodeUiState },
						},
					},
				};
			}),
	});
}
