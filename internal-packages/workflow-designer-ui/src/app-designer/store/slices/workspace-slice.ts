import {
	type Connection,
	type ConnectionId,
	type NodeBase,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type ShortcutScope,
	type Viewport,
	type Workspace,
} from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { AppDesignerStoreState } from "../app-designer-store";

export interface WorkspaceActions {
	addNode: (node: NodeLike) => void;
	upsertUiNodeState: (nodeId: NodeId | string, ui: NodeUIState) => void;
	updateNode: (nodeId: NodeId | string, data: Partial<NodeBase>) => void;
	addConnection: (connection: Connection) => void;
	removeConnection: (connectionId: string) => void;
	removeNode: (nodeId: NodeId | string) => void;
	setUiNodeState: (nodeId: NodeId | string, ui: Partial<NodeUIState>) => void;
	setUiViewport: (viewport: Viewport, options?: { save?: boolean }) => void;
	setSelectedConnectionIds: (connectionIds: ConnectionId[]) => void;
	setCurrentShortcutScope: (
		scope: ShortcutScope,
		options?: { save?: boolean },
	) => void;
	updateWorkspaceName: (name: string | undefined) => void;
}

export type WorkspaceSlice = Omit<Workspace, "id"> & {
	workspaceId: Workspace["id"];
} & WorkspaceActions & {
		/**
		 * When true, persistence should ignore the next store update and reset this flag.
		 * Useful for UI-only state changes you don't want to persist.
		 */
		_skipNextSave: boolean;
	};

type WorkspaceSliceCreator = StateCreator<
	AppDesignerStoreState,
	[],
	[],
	WorkspaceSlice
>;

export function createWorkspaceSlice(
	initial: Workspace,
): WorkspaceSliceCreator {
	return (set, _get) => ({
		workspaceId: initial.id,
		name: initial.name,
		schemaVersion: initial.schemaVersion,
		nodes: initial.nodes,
		connections: initial.connections,
		ui: initial.ui,
		_skipNextSave: false,
		addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
		upsertUiNodeState: (nodeId, ui) =>
			set((s) => ({
				ui: {
					...s.ui,
					nodeState: {
						...s.ui.nodeState,
						[NodeId.parse(nodeId)]: ui,
					},
				},
			})),
		updateNode: (nodeId, data) =>
			set((s) => ({
				nodes: s.nodes.map((n) =>
					n.id === NodeId.parse(nodeId) ? ({ ...n, ...data } as NodeLike) : n,
				),
			})),
		addConnection: (connection) =>
			set((s) => ({ connections: [...s.connections, connection] })),
		removeConnection: (connectionId) =>
			set((s) => ({
				connections: s.connections.filter((c) => c.id !== connectionId),
			})),
		removeNode: (nodeIdToDelete) =>
			set((s) => ({
				nodes: s.nodes.filter((n) => n.id !== NodeId.parse(nodeIdToDelete)),
			})),
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
		setCurrentShortcutScope: (scope, options) =>
			set((s) => ({
				_skipNextSave: !options?.save,
				ui: { ...s.ui, currentShortcutScope: scope },
			})),
		setSelectedConnectionIds: (connectionIds) =>
			set((s) => ({
				ui: { ...s.ui, selectedConnectionIds: connectionIds },
			})),
		updateWorkspaceName: (name) => set({ name }),
	});
}
