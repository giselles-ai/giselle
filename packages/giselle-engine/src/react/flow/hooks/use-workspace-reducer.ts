import {
	type Connection,
	type ConnectionId,
	type FileData,
	type FileNode,
	type Node,
	type NodeBase,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type Viewport,
	type Workspace,
} from "@giselle-sdk/data-type";
import { useCallback, useEffect, useReducer, useRef } from "react";

export type WorkspaceAction =
	| { type: "ADD_NODE"; node: NodeLike; ui?: NodeUIState }
	| { type: "UPDATE_NODE"; nodeId: NodeId; data: Partial<NodeBase> }
	| { type: "DELETE_NODE"; nodeId: NodeId }
	| { type: "ADD_CONNECTION"; connection: Connection }
	| { type: "DELETE_CONNECTION"; connectionId: ConnectionId }
	| {
			type: "SET_UI_NODE_STATE";
			nodeId: NodeId;
			ui: Partial<NodeUIState>;
			save?: boolean;
	  }
	| { type: "SET_UI_VIEWPORT"; viewport: Viewport }
	| { type: "UPDATE_WORKSPACE_NAME"; name: string | undefined }
	| {
			type: "UPDATE_NODE_CONTENT";
			nodeId: NodeId;
			content: Partial<Node["content"]>;
	  }
	| { type: "UPDATE_FILE_STATUS"; nodeId: NodeId; files: FileData[] }
	| { type: "NO_OP" };

function workspaceReducer(
	state: Workspace,
	action: WorkspaceAction,
): Workspace {
	switch (action.type) {
		case "ADD_NODE": {
			const ui = { ...state.ui };
			if (action.ui) {
				ui.nodeState = { ...ui.nodeState, [action.node.id]: action.ui };
			}
			return { ...state, nodes: [...state.nodes, action.node], ui };
		}
		case "UPDATE_NODE": {
			return {
				...state,
				nodes: state.nodes.map((n) =>
					n.id === action.nodeId ? ({ ...n, ...action.data } as NodeLike) : n,
				),
			};
		}
		case "DELETE_NODE": {
			const nodeId = NodeId.parse(action.nodeId);
			const ui = { ...state.ui, nodeState: { ...state.ui.nodeState } };
			delete ui.nodeState[nodeId];
			return {
				...state,
				nodes: state.nodes.filter((n) => n.id !== nodeId),
				ui,
			};
		}
		case "ADD_CONNECTION": {
			return {
				...state,
				connections: [...state.connections, action.connection],
			};
		}
		case "DELETE_CONNECTION": {
			return {
				...state,
				connections: state.connections.filter(
					(c) => c.id !== action.connectionId,
				),
			};
		}
		case "SET_UI_NODE_STATE": {
			const nodeId = NodeId.parse(action.nodeId);
			const nodeState = state.ui.nodeState[nodeId] ?? {};
			return {
				...state,
				ui: {
					...state.ui,
					nodeState: {
						...state.ui.nodeState,
						[nodeId]: { ...nodeState, ...action.ui },
					},
				},
			};
		}
		case "SET_UI_VIEWPORT": {
			return { ...state, ui: { ...state.ui, viewport: action.viewport } };
		}
		case "UPDATE_WORKSPACE_NAME": {
			return { ...state, name: action.name };
		}
		case "UPDATE_NODE_CONTENT": {
			return {
				...state,
				nodes: state.nodes.map((n) =>
					n.id === action.nodeId
						? ({
								...n,
								content: { ...(n as Node).content, ...action.content },
							} as NodeLike)
						: n,
				),
			};
		}
		case "UPDATE_FILE_STATUS": {
			return {
				...state,
				nodes: state.nodes.map((n) =>
					n.id === action.nodeId
						? ({
								...n,
								content: { ...(n as FileNode).content, files: action.files },
							} as NodeLike)
						: n,
				),
			};
		}
		case "NO_OP": {
			return state;
		}
		default:
			return state;
	}
}

export function useWorkspaceReducer(
	initialState: Workspace,
	save: (workspace: Workspace) => Promise<void>,
	saveDelay: number,
) {
	const [state, dispatch] = useReducer(workspaceReducer, initialState);
	const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const skipNextSaveRef = useRef(false);

	const scheduleSave = useCallback(() => {
		if (persistTimeoutRef.current) {
			clearTimeout(persistTimeoutRef.current);
		}
		persistTimeoutRef.current = setTimeout(() => {
			void save(state);
		}, saveDelay);
	}, [saveDelay, save, state]);

	useEffect(() => {
		if (skipNextSaveRef.current) {
			skipNextSaveRef.current = false;
			return;
		}
		scheduleSave();
	}, [scheduleSave]);

	const enhancedDispatch = useCallback(
		(action: WorkspaceAction & { skipSave?: boolean }) => {
			if (action.skipSave) {
				skipNextSaveRef.current = true;
			}
			dispatch(action);
		},
		[],
	);

	return { workspace: state, dispatch: enhancedDispatch } as const;
}
