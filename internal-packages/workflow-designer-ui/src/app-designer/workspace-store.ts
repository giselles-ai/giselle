import type {
	Connection,
	ConnectionId,
	Node,
	NodeId,
	NodeUIState,
} from "@giselles-ai/protocol";
import { createStore } from "zustand";

type UINode = Node & {
	ui: NodeUIState;
};
export interface WorkspaceData {
	nodes: UINode[];
	connections: Connection[];
}
export interface WorkspaceActions {
	addNode: (node: UINode) => void;
	addConnection: (connection: Connection) => void;
	removeNode: (id: NodeId) => void;
	removeConnection: (id: ConnectionId) => void;
}

type WorkspaceStoreState = {
	data: WorkspaceData;
	actions: WorkspaceActions;
};

export function createWorkspaceStore(initialData: WorkspaceData) {
	return createStore<WorkspaceStoreState>((set) => ({
		data: initialData,
		actions: {
			addNode: (node) =>
				set((s) => ({ data: { ...s.data, nodes: [...s.data.nodes, node] } })),
			addConnection: (connection) =>
				set((s) => ({
					data: { ...s.data, connections: [...s.data.connections, connection] },
				})),
			removeNode: (id) =>
				set((s) => ({
					data: { ...s.data, nodes: s.data.nodes.filter((n) => n.id !== id) },
				})),
			removeConnection: (id) =>
				set((s) => ({
					data: {
						...s.data,
						connections: s.data.connections.filter((c) => c.id !== id),
					},
				})),
		},
	}));
}

export type WorkspaceStoreApi = ReturnType<typeof createWorkspaceStore>;
