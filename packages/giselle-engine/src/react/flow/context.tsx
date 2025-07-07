"use client";

import {
	type Connection,
	ConnectionId,
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileData,
	type FileNode,
	type InputId,
	type Node,
	type NodeBase,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type OutputId,
	type UploadedFileData,
	type Viewport,
	type Workspace,
} from "@giselle-sdk/data-type";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useState,
} from "react";
import { nodeFactories } from "../../utils";
import { APICallError } from "../errors";
import { useGiselleEngine } from "../use-giselle-engine";
import type {
	ConnectionCloneStrategy,
	WorkflowDesignerContextValue,
} from "./types";
import { isSupportedConnection } from "./utils";

const DEFAULT_SAVE_DELAY = 1000;

export const WorkflowDesignerContext = createContext<
	WorkflowDesignerContextValue | undefined
>(undefined);

export function WorkflowDesignerProvider({
	children,
	data,
	textGenerationApi = "/api/giselle/text-generation",
	saveWorkflowDelay = DEFAULT_SAVE_DELAY,
}: {
	children: React.ReactNode;
	data: Workspace;
	saveWorkflowApi?: string;
	textGenerationApi?: string;
	runAssistantApi?: string;
	saveWorkflowDelay?: number;
}) {
	const client = useGiselleEngine();
	const { workspace, dispatch } = useWorkspaceReducer(
		data,
		async (ws) => {
			try {
				await client.updateWorkspace({ workspace: ws });
			} catch (error) {
				console.error("Failed to persist graph:", error);
			}
		},
		saveWorkflowDelay,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [llmProviders, setLLMProviders] = useState<LanguageModelProvider[]>([]);

	const addNode = useAddNode(dispatch);
	const addConnection = useAddConnection(dispatch);
	const updateNodeData = useNodeUpdate(dispatch);
	const copyNode = useCopyNode(workspace, dispatch);

	useEffect(() => {
		client
			.getLanguageModelProviders()
			.then(setLLMProviders)
			.then(() => setIsLoading(false));
	}, [client]);

	const setUiNodeState = useCallback(
		(
			nodeId: string | NodeId,
			ui: Partial<NodeUIState>,
			options?: { save?: boolean },
		) => {
			dispatch({
				type: "SET_UI_NODE_STATE",
				nodeId: NodeId.parse(nodeId),
				ui,
				save: options?.save,
				skipSave: !options?.save,
			});
		},
		[dispatch],
	);

	const setUiViewport = useCallback(
		(viewport: Viewport) => {
			dispatch({ type: "SET_UI_VIEWPORT", viewport });
		},
		[dispatch],
	);

	const updateName = useCallback(
		(newName: string | undefined) => {
			dispatch({ type: "UPDATE_WORKSPACE_NAME", name: newName });
		},
		[dispatch],
	);

	const deleteNode = useCallback(
		(nodeId: NodeId | string) => {
			dispatch({ type: "DELETE_NODE", nodeId: NodeId.parse(nodeId) });
		},
		[dispatch],
	);

	const deleteConnection = useCallback(
		(connectionId: ConnectionId) => {
			dispatch({ type: "DELETE_CONNECTION", connectionId });
		},
		[dispatch],
	);

	const updateNodeDataContent = useCallback(
		<T extends Node>(node: T, content: Partial<T["content"]>) => {
			updateNodeData(node, {
				content: { ...node.content, ...content },
			} as Partial<T>);
		},
		[updateNodeData],
	);

	const isSupportedConnectionCb = useCallback(isSupportedConnection, []);

	const uploadFile = useCallback<
		(
			files: File[],
			node: FileNode,
			options?: { onError?: (error: string) => void },
		) => Promise<void>
	>(
		async (files, node, options) => {
			const uploaders = files.map((file) => {
				return async () => {
					let fileContents = node.content.files;
					if (fileContents.some((f) => f.name === file.name)) {
						options?.onError?.("duplicate file name");
						return;
					}
					const uploadingFileData = createUploadingFileData({
						name: file.name,
						type: file.type,
						size: file.size,
					});
					fileContents = [...fileContents, uploadingFileData];
					updateNodeDataContent(node, { files: fileContents });
					try {
						await client.uploadFile({
							workspaceId: data.id,
							file,
							fileId: uploadingFileData.id,
							fileName: file.name,
						});
						const uploadedFileData = createUploadedFileData(
							uploadingFileData,
							Date.now(),
						);
						fileContents = [
							...fileContents.filter((f) => f.id !== uploadedFileData.id),
							uploadedFileData,
						];
					} catch (error) {
						if (APICallError.isInstance(error)) {
							const message =
								error.statusCode === 413 ? "filesize too large" : error.message;
							options?.onError?.(message);
							const failedFileData = createFailedFileData(
								uploadingFileData,
								message,
							);
							fileContents = [
								...fileContents.filter((f) => f.id !== failedFileData.id),
								failedFileData,
							];
						}
					}
					updateNodeDataContent(node, { files: fileContents });
				};
			});
			for (const uploader of uploaders) {
				await uploader();
			}
		},
		[updateNodeDataContent, client, data.id],
	);

	const removeFile = useCallback(
		async (uploadedFile: UploadedFileData) => {
			await client.removeFile({
				workspaceId: data.id,
				fileId: uploadedFile.id,
			});
			dispatch({ type: "NO_OP" });
		},
		[client, data.id, dispatch],
	);

	const propertiesPanelHelper = usePropertiesPanel();

	return (
		<WorkflowDesignerContext.Provider
			value={{
				data: workspace,
				textGenerationApi,
				addNode,
				copyNode,
				addConnection,
				updateNodeData,
				updateNodeDataContent,
				setUiNodeState,
				deleteNode,
				deleteConnection,
				uploadFile,
				removeFile,
				llmProviders,
				isLoading,
				setUiViewport,
				updateName,
				isSupportedConnection: isSupportedConnectionCb,
				...propertiesPanelHelper,
			}}
		>
			{children}
		</WorkflowDesignerContext.Provider>
	);
}

export function useWorkflowDesigner() {
	const context = useContext(WorkflowDesignerContext);
	if (context === undefined) {
		throw new Error(
			"useWorkflowDesigner must be used within a WorkflowDesignerProvider",
		);
	}
	return context;
}

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

export function useAddNode(dispatch: React.Dispatch<WorkspaceAction>) {
	return useCallback(
		(node: Node | NodeLike, options?: { ui?: NodeUIState }) => {
			dispatch({
				type: "ADD_NODE",
				node: node as NodeLike,
				ui: options?.ui,
			});
		},
		[dispatch],
	);
}

export function useAddConnection(dispatch: React.Dispatch<WorkspaceAction>) {
	return useCallback(
		({
			outputNode,
			outputId,
			inputNode,
			inputId,
		}: {
			outputNode: NodeLike;
			outputId: OutputId;
			inputNode: NodeLike;
			inputId: InputId;
		}) => {
			dispatch({
				type: "ADD_CONNECTION",
				connection: {
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
			});
		},
		[dispatch],
	);
}

export function useCopyNode(
	workspace: Workspace,
	dispatch: React.Dispatch<WorkspaceAction>,
) {
	const addConnection = useAddConnection(dispatch);
	const DEFAULT_CONNECTION_CLONE_STRATEGY: ConnectionCloneStrategy =
		"inputs-only";

	return useCallback(
		(
			sourceNode: Node,
			options?: {
				ui?: NodeUIState;
				connectionCloneStrategy?: ConnectionCloneStrategy;
			},
		): Node | undefined => {
			const { newNode, inputIdMap, outputIdMap } =
				nodeFactories.clone(sourceNode);
			dispatch({ type: "ADD_NODE", node: newNode, ui: options?.ui });
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
						const connectionExists = workspace.connections.some(
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
							addConnection({
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
						const connectionExists = workspace.connections.some(
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
							addConnection({
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
		[workspace, dispatch, addConnection],
	);
}

export function useNodeUpdate(dispatch: React.Dispatch<WorkspaceAction>) {
	return useCallback(
		<T extends NodeBase>(node: T, data: Partial<T>) => {
			dispatch({ type: "UPDATE_NODE", nodeId: node.id, data });
		},
		[dispatch],
	);
}

export function usePropertiesPanel() {
	const [propertiesTab, setPropertiesTab] = useState("");
	const [openPropertiesPanel, setOpenPropertiesPanel] = useState(false);

	return {
		propertiesTab,
		setPropertiesTab,
		openPropertiesPanel,
		setOpenPropertiesPanel,
	} as const;
}
