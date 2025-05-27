"use client";

import {
	type ConnectionId,
	type FailedFileData,
	type FileContent,
	type FileData,
	type FileNode,
	type Node,
	type NodeBase,
	type NodeId,
	type NodeUIState,
	type UploadedFileData,
	type Viewport,
	type Workspace,
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
} from "@giselle-sdk/data-type";
import { GenerationRunnerSystemProvider } from "@giselle-sdk/giselle-engine/react";
import {
	APICallError,
	useGiselleEngine,
} from "@giselle-sdk/giselle-engine/react";
import { RunSystemContextProvider } from "@giselle-sdk/giselle-engine/react";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { ClonedFileDataPayload } from "@giselle-sdk/node-utils";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import {
	type ConnectionCloneStrategy,
	WorkflowDesigner,
} from "../workflow-designer";
import { usePropertiesPanel, useView } from "./state";

type UploadFileFn = (
	files: File[],
	node: FileNode,
	options?: { onError?: (errorMessage: string) => void },
) => Promise<void>;

export interface WorkflowDesignerContextValue
	extends Pick<
			WorkflowDesigner,
			| "addNode"
			| "updateNodeData"
			| "addConnection"
			| "deleteConnection"
			| "setUiViewport"
			| "updateName"
			| "isSupportedConnection"
		>,
		ReturnType<typeof usePropertiesPanel>,
		ReturnType<typeof useView> {
	data: Workspace;
	textGenerationApi: string;
	setUiNodeState: (
		nodeId: string | NodeId,
		ui: Partial<NodeUIState>,
		options?: { save?: boolean },
	) => void;
	updateNodeDataContent: <T extends Node>(
		node: T,
		content: Partial<T["content"]>,
	) => void;
	uploadFile: UploadFileFn;
	removeFile: (uploadedFile: UploadedFileData) => Promise<void>;
	copyNode: (
		sourceNode: Node,
		options?: {
			ui?: NodeUIState;
			connectionCloneStrategy?: ConnectionCloneStrategy;
		},
	) => Promise<Node | undefined>;
	deleteNode: (nodeId: NodeId | string) => void;
	llmProviders: LanguageModelProvider[];
	isLoading: boolean;
}
export const WorkflowDesignerContext = createContext<
	WorkflowDesignerContextValue | undefined
>(undefined);

type Timer = ReturnType<typeof setTimeout>;
export function WorkflowDesignerProvider({
	children,
	data,
	textGenerationApi = "/api/giselle/text-generation",
	saveWorkflowDelay: defaultSaveWorkflowDelay = 1000,
}: {
	children: React.ReactNode;
	data: Workspace;
	saveWorkflowApi?: string;
	textGenerationApi?: string;
	runAssistantApi?: string;
	saveWorkflowDelay?: number;
}) {
	const workflowDesignerRef = useRef(WorkflowDesigner({ defaultValue: data }));
	const client = useGiselleEngine();
	const [workspace, setWorkspaceInternal] = useState(data);
	const persistTimeoutRef = useRef<Timer | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [llmProviders, setLLMProviders] = useState<LanguageModelProvider[]>([]);

	useEffect(() => {
		client
			.getLanguageModelProviders()
			.then(setLLMProviders)
			.then(() => setIsLoading(false));
	}, [client]);

	const saveWorkspace = useCallback(async () => {
		try {
			await client.updateWorkspace({
				workspace: workflowDesignerRef.current.getData(),
			});
		} catch (error) {
			console.error("Failed to persist graph:", error);
		}
	}, [client]);

	const setWorkspace = useCallback(() => {
		const data = workflowDesignerRef.current.getData();
		setWorkspaceInternal(data);
	}, []);
	const setAndSaveWorkspace = useCallback(
		(saveWorkspaceDelay?: number) => {
			setWorkspace();
			if (persistTimeoutRef.current) {
				clearTimeout(persistTimeoutRef.current);
			}
			if (saveWorkspaceDelay === 0) {
				saveWorkspace();
				return;
			}
			persistTimeoutRef.current = setTimeout(
				saveWorkspace,
				saveWorkspaceDelay ?? defaultSaveWorkflowDelay,
			);
		},
		[setWorkspace, saveWorkspace, defaultSaveWorkflowDelay],
	);

	const addNode = useCallback(
		(node: Node, options?: { ui?: NodeUIState }) => {
			workflowDesignerRef.current.addNode(node, options);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const copyNode = useCallback(
		async (
			sourceNode: Node,
			options?: {
				ui?: NodeUIState;
				connectionCloneStrategy?: ConnectionCloneStrategy;
			},
		): Promise<Node | undefined> => {
			const newNodeDefinition = workflowDesignerRef.current.copyNode(
				sourceNode,
				options,
			);

			if (!newNodeDefinition) {
				return undefined;
			}

			workflowDesignerRef.current.addNode(newNodeDefinition);
			setAndSaveWorkspace();

			const finalNewNode = newNodeDefinition;

			(async () => {
				if (
					finalNewNode.type === "variable" &&
					finalNewNode.content.type === "file" &&
					sourceNode.type === "variable" &&
					sourceNode.content.type === "file"
				) {
					const newFileNode = finalNewNode as FileNode;

					const fileCopyPromises = newFileNode.content.files.map(
						async (fileDataWithOriginalId) => {
							const tempFileData =
								fileDataWithOriginalId as ClonedFileDataPayload;
							const { originalFileIdForCopy, ...newFileData } = tempFileData;

							if (originalFileIdForCopy) {
								try {
									await client.copyFile({
										workspaceId: data.id,
										sourceFileId: originalFileIdForCopy,
										destinationFileId: newFileData.id,
									});

									return newFileData as FileData;
								} catch (error) {
									console.error(
										`Context: Failed to copy file for new fileId ${newFileData.id} (source: ${originalFileIdForCopy}):`,
										error,
									);

									return {
										...newFileData,
										status: "failed",
										errorMessage:
											error instanceof Error ? error.message : "Unknown error",
									} as FailedFileData;
								}
							}

							return newFileData as FileData;
						},
					);

					const resolvedFiles = await Promise.all(fileCopyPromises);
					const newContentForNode: FileContent = {
						...newFileNode.content,
						files: resolvedFiles,
					};

					workflowDesignerRef.current.updateNodeData(newFileNode, {
						content: newContentForNode,
					});
				}

				setAndSaveWorkspace();
			})();

			return finalNewNode;
		},
		[client, data.id, setAndSaveWorkspace],
	);

	const updateNodeData = useCallback(
		<T extends NodeBase>(node: T, data: Partial<T>) => {
			workflowDesignerRef.current.updateNodeData(node, data);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const updateNodeDataContent = useCallback(
		<T extends Node>(node: T, content: Partial<T["content"]>) => {
			workflowDesignerRef.current.updateNodeData(node, {
				...node,
				content: { ...node.content, ...content },
			});
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const addConnection = useCallback<WorkflowDesigner["addConnection"]>(
		(args) => {
			workflowDesignerRef.current?.addConnection(args);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const updateName = useCallback<WorkflowDesigner["updateName"]>(
		(args) => {
			workflowDesignerRef.current?.updateName(args);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const isSupportedConnection = useCallback<
		WorkflowDesigner["isSupportedConnection"]
	>((outputNode, inputNode) => {
		return workflowDesignerRef.current?.isSupportedConnection(
			outputNode,
			inputNode,
		);
	}, []);

	const setUiNodeState = useCallback(
		(
			nodeId: string | NodeId,
			ui: Partial<NodeUIState>,
			options: { save?: boolean } | undefined,
		) => {
			workflowDesignerRef.current.setUiNodeState(nodeId, ui);
			if (options?.save) {
				setAndSaveWorkspace();
			} else {
				setWorkspace();
			}
		},
		[setAndSaveWorkspace, setWorkspace],
	);

	const setUiViewport = useCallback(
		(viewport: Viewport) => {
			workflowDesignerRef.current.setUiViewport(viewport);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const deleteNode = useCallback(
		(nodeId: NodeId | string) => {
			workflowDesignerRef.current.deleteNode(nodeId);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const deleteConnection = useCallback(
		(connectionId: ConnectionId) => {
			workflowDesignerRef.current.deleteConnection(connectionId);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const uploadFile = useCallback(
		async (
			files: File[],
			node: FileNode,
			options: { onError?: (errorMessage: string) => void } | undefined,
		) => {
			let fileContents = node.content.files;

			await Promise.all(
				files.map(async (file) => {
					const fileReader = new FileReader();
					fileReader.readAsArrayBuffer(file);
					fileReader.onload = async () => {
						if (!fileReader.result) {
							return;
						}
						const uploadingFileData = createUploadingFileData({
							name: file.name,
							type: file.type,
							size: file.size,
						});
						fileContents = [...fileContents, uploadingFileData];

						updateNodeDataContent(node, {
							files: fileContents,
						});
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
								...fileContents.filter(
									(file) => file.id !== uploadedFileData.id,
								),
								uploadedFileData,
							];
						} catch (error) {
							if (APICallError.isInstance(error)) {
								const message =
									error.statusCode === 413
										? "filesize too large"
										: error.message;
								options?.onError?.(message);
								const failedFileData = createFailedFileData(
									uploadingFileData,
									message,
								);
								fileContents = [
									...fileContents.filter(
										(file) => file.id !== failedFileData.id,
									),
									failedFileData,
								];
							}
						}
						updateNodeDataContent(node, {
							files: fileContents,
						});
					};
				}),
			);
		},
		[updateNodeDataContent, client, data.id],
	);

	const removeFile = useCallback(
		async (uploadedFile: UploadedFileData) => {
			await client.removeFile({
				workspaceId: data.id,
				fileId: uploadedFile.id,
			});
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace, client, data.id],
	);

	const usePropertiesPanelHelper = usePropertiesPanel();
	const useViewHelper = useView();

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
				isSupportedConnection,
				...usePropertiesPanelHelper,
				...useViewHelper,
			}}
		>
			<GenerationRunnerSystemProvider>
				<RunSystemContextProvider workspaceId={data.id}>
					{children}
				</RunSystemContextProvider>
			</GenerationRunnerSystemProvider>
		</WorkflowDesignerContext.Provider>
	);
}
