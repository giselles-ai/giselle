import {
	type Connection,
	type FileData,
	type FileNode,
	type Node,
	type NodeBase,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type ShortcutScope,
	type Viewport,
	type Workspace,
} from "@giselle-sdk/data-type";
import { useCallback, useEffect, useReducer, useRef } from "react";

export type WorkspaceAction =
	| { type: "ADD_NODE"; node: NodeLike; ui?: NodeUIState }
	| { type: "UPDATE_NODE"; nodeId: NodeId; data: Partial<NodeBase> }
	| { type: "DELETE_NODE"; nodeId: NodeId }
	| { type: "ADD_CONNECTION"; connection: Connection }
	| { type: "DELETE_CONNECTION"; connectionId: string }
	| {
			type: "SET_UI_NODE_STATE";
			nodeId: NodeId;
			ui: Partial<NodeUIState>;
			save?: boolean;
	  }
	| { type: "SET_UI_VIEWPORT"; viewport: Viewport }
	| {
			type: "SET_CURRENT_SHORTCUT_SCOPE";
			scope: ShortcutScope;
	  }
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
		case "SET_CURRENT_SHORTCUT_SCOPE": {
			return {
				...state,
				ui: { ...state.ui, currentShortcutScope: action.scope },
			};
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
	const latestStateRef = useRef(state);

	useEffect(() => {
		latestStateRef.current = state;
	}, [state]);

	const clearScheduledSave = useCallback(() => {
		if (!persistTimeoutRef.current) return;
		clearTimeout(persistTimeoutRef.current);
		persistTimeoutRef.current = null;
	}, []);

	const scheduleSave = useCallback(() => {
		clearScheduledSave();
		persistTimeoutRef.current = setTimeout(() => {
			persistTimeoutRef.current = null;
			void save(latestStateRef.current);
		}, saveDelay);
	}, [clearScheduledSave, save, saveDelay]);

	useEffect(() => {
		if (skipNextSaveRef.current) {
			skipNextSaveRef.current = false;
			return;
		}
		scheduleSave();
	}, [scheduleSave]);

	useEffect(
		() => () => {
			clearScheduledSave();
		},
		[clearScheduledSave],
	);

	const enhancedDispatch = useCallback(
		(action: WorkspaceAction & { skipSave?: boolean }) => {
			if (action.skipSave) {
				skipNextSaveRef.current = true;
			}
			dispatch(action);
		},
		[],
	);

	const saveImmediately = useCallback(async () => {
		clearScheduledSave();
		await save(latestStateRef.current);
	}, [clearScheduledSave, save]);

	return {
		workspace: state,
		dispatch: enhancedDispatch,
		saveWorkspace: saveImmediately,
	} as const;
}
