"use client";

import {
	type ConnectionId,
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileNode,
	type FocusedArea,
	type Node,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type UploadedFileData,
	type Viewport,
	type Workspace,
} from "@giselle-sdk/data-type";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import { createContext, useCallback, useEffect, useState } from "react";
import { APICallError } from "../errors";
import { useFeatureFlag } from "../feature-flags";
import { useGiselleEngine } from "../use-giselle-engine";
import {
	useAddConnection,
	useAddNode,
	useCopyNode,
	useNodeUpdate,
	usePropertiesPanel,
	useWorkspaceReducer,
} from "./hooks";
import type { WorkflowDesignerContextValue } from "./types";
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
	const { experimental_storage } = useFeatureFlag();
	const { workspace, dispatch } = useWorkspaceReducer(
		data,
		async (ws) => {
			try {
				await client.updateWorkspace({
					workspace: ws,
					useExperimentalStorage: experimental_storage,
				});
			} catch (error) {
				console.error("Failed to persist graph:", error);
			}
		},
		saveWorkflowDelay,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [llmProviders, setLLMProviders] = useState<LanguageModelProvider[]>([]);
	const [copiedNode, setCopiedNode] = useState<NodeLike | null>(null);

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

	const setUiFocusedArea = useCallback(
		(area: FocusedArea) => {
			dispatch({ type: "SET_UI_FOCUSED_AREA", area });
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
							useExperimentalStorage: experimental_storage,
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
		[updateNodeDataContent, client, data.id, experimental_storage],
	);

	const removeFile = useCallback(
		async (uploadedFile: UploadedFileData) => {
			await client.removeFile({
				workspaceId: data.id,
				fileId: uploadedFile.id,
				useExperimentalStorage: experimental_storage,
			});
			dispatch({ type: "NO_OP" });
		},
		[client, data.id, dispatch, experimental_storage],
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
				setUiFocusedArea,
				copiedNode,
				setCopiedNode,
				...propertiesPanelHelper,
			}}
		>
			{children}
		</WorkflowDesignerContext.Provider>
	);
}
