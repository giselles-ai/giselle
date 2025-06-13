"use client";

import {
	type ConnectionId,
	type FailedFileData,
	type FileContent,
	type FileNode,
	type Node,
	type NodeBase,
	NodeId,
	type NodeUIState,
	type TriggerNode,
	type UploadedFileData,
	type Viewport,
	type Workspace,
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	isActionNode,
	isFileNode,
	isTriggerNode,
	isVectorStoreNode,
} from "@giselle-sdk/data-type";
import { GenerationRunnerSystemProvider } from "@giselle-sdk/giselle-engine/react";
import {
	APICallError,
	useGiselleEngine,
} from "@giselle-sdk/giselle-engine/react";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import {
	cleanupNodeReferencesInText,
	cleanupSpecificNodeReferenceInText,
	isClonedFileDataPayload,
} from "@giselle-sdk/node-utils";
import {
	type SourceNode,
	containsNodeReference,
	containsSpecificNodeReference,
	isJsonContent,
} from "@giselle-sdk/text-editor-utils";
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
	deleteNode: (nodeId: NodeId | string) => Promise<void>;
	deleteConnectionWithCleanup: (connectionId: ConnectionId) => void;
	handleSourceRemoved: (removedSources: SourceNode[]) => void;
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

	const handleFileNodeCopy = useCallback(
		async (sourceNode: Node, newNode: Node): Promise<void> => {
			if (!isFileNode(newNode) || !isFileNode(sourceNode)) {
				return;
			}

			const fileCopyPromises = newNode.content.files.map(
				async (fileDataWithOriginalId) => {
					if (!isClonedFileDataPayload(fileDataWithOriginalId)) {
						// Already completed file data, keep as is
						return fileDataWithOriginalId;
					}

					const { originalFileIdForCopy, ...newFileData } =
						fileDataWithOriginalId;

					if (originalFileIdForCopy) {
						try {
							await client.copyFile({
								workspaceId: data.id,
								sourceFileId: originalFileIdForCopy,
								destinationFileId: newFileData.id,
							});

							return newFileData;
						} catch (error) {
							console.error(
								`Failed to copy file for new fileId ${newFileData.id} (source: ${originalFileIdForCopy}):`,
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

					return newFileData;
				},
			);

			const resolvedFiles = await Promise.all(fileCopyPromises);
			const newContentForNode: FileContent = {
				...newNode.content,
				files: resolvedFiles,
			};

			workflowDesignerRef.current.updateNodeData(newNode, {
				content: newContentForNode,
			});

			setAndSaveWorkspace();
		},
		[client, data.id, setAndSaveWorkspace],
	);

	const handleTriggerNodeCopy = useCallback(
		async (sourceNode: Node, newNode: Node): Promise<void> => {
			if (
				!isTriggerNode(sourceNode) ||
				!isTriggerNode(newNode) ||
				sourceNode.content.state.status !== "configured"
			) {
				return;
			}

			try {
				const originalTriggerId = sourceNode.content.state.flowTriggerId;

				const originalTriggerResult = await client.getTrigger({
					flowTriggerId: originalTriggerId,
				});

				if (originalTriggerResult?.trigger) {
					const originalTrigger = originalTriggerResult.trigger;
					const result = await client.configureTrigger({
						trigger: {
							workspaceId: originalTrigger.workspaceId,
							nodeId: newNode.id,
							enable: originalTrigger.enable,
							configuration: originalTrigger.configuration,
						},
					});

					if (result?.triggerId) {
						workflowDesignerRef.current.updateNodeData(newNode, {
							content: {
								...newNode.content,
								state: {
									status: "configured",
									flowTriggerId: result.triggerId,
								},
							},
						} as Partial<TriggerNode>);

						setAndSaveWorkspace();
					}
				}
			} catch (error) {
				console.error("Failed to duplicate trigger configuration:", error);
			}
		},
		[client, setAndSaveWorkspace],
	);

	const handleActionNodeCopy = useCallback(
		(sourceNode: Node, newNode: Node): void => {
			if (
				!isActionNode(sourceNode) ||
				!isActionNode(newNode) ||
				sourceNode.content.command.state.status !== "configured"
			) {
				return;
			}

			workflowDesignerRef.current.updateNodeData(newNode, {
				content: {
					...newNode.content,
					command: {
						...newNode.content.command,
						state: structuredClone(sourceNode.content.command.state),
					},
				},
			});
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const handleVectorStoreNodeCopy = useCallback(
		(sourceNode: Node, newNode: Node): void => {
			if (
				!isVectorStoreNode(sourceNode) ||
				!isVectorStoreNode(newNode) ||
				sourceNode.content.source.state.status !== "configured"
			) {
				return;
			}

			workflowDesignerRef.current.updateNodeData(newNode, {
				content: {
					...newNode.content,
					source: structuredClone(sourceNode.content.source),
				},
			});
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
			setAndSaveWorkspace();

			// Handle different node types - following existing pattern
			await handleFileNodeCopy(sourceNode, newNodeDefinition);
			await handleTriggerNodeCopy(sourceNode, newNodeDefinition);
			handleActionNodeCopy(sourceNode, newNodeDefinition);
			handleVectorStoreNodeCopy(sourceNode, newNodeDefinition);

			return newNodeDefinition;
		},
		[
			setAndSaveWorkspace,
			handleFileNodeCopy,
			handleTriggerNodeCopy,
			handleActionNodeCopy,
			handleVectorStoreNodeCopy,
		],
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

	const handleDeleteNodeCleanup = useCallback(
		(unsafeNodeId: string | NodeId) => {
			const deletedNodeId = NodeId.parse(unsafeNodeId);
			const currentWorkspace = workflowDesignerRef.current.getData();

			// Process nodes and clean up references
			for (const node of currentWorkspace.nodes) {
				// Check if node contains reference to deleted node
				const hasReference = Object.values(node.content).some((value) => {
					if (typeof value === "string" && value.length > 0) {
						return (
							containsNodeReference(value, deletedNodeId) ||
							(isJsonContent(value) &&
								value.includes(`"id":"${deletedNodeId}"`))
						);
					}
					return false;
				});

				// Skip if no reference found
				if (!hasReference) {
					continue;
				}

				// Clean up all string fields
				let hasChanges = false;
				const updatedContent = { ...node.content };
				for (const [key, value] of Object.entries(node.content)) {
					if (typeof value === "string" && value.length > 0) {
						const cleaned = cleanupNodeReferencesInText(value, deletedNodeId);
						if (cleaned !== value) {
							(updatedContent as Record<string, unknown>)[key] = cleaned;
							hasChanges = true;
						}
					}
				}

				// Update node if changes were made
				if (hasChanges) {
					workflowDesignerRef.current.updateNodeData(node, {
						content: updatedContent,
					} as Partial<typeof node>);
				}
			}
		},
		[],
	);

	const handleDeleteTriggerCleanup = useCallback(
		async (deletedNode: unknown) => {
			if (
				isTriggerNode(deletedNode) &&
				deletedNode.content.state.status === "configured"
			) {
				try {
					await client.deleteTrigger({
						flowTriggerId: deletedNode.content.state.flowTriggerId,
					});
				} catch (error) {
					console.error("Failed to delete trigger", error);
				}
			}
		},
		[client],
	);

	const handleSourceRemoved = useCallback(
		(removedSources: SourceNode[]) => {
			const currentWorkspace = workflowDesignerRef.current.getData();

			for (const removedSource of removedSources) {
				// Clean up references to this source in all nodes
				for (const node of currentWorkspace.nodes) {
					const hasReference = Object.values(node.content).some((value) => {
						if (typeof value === "string" && value.length > 0) {
							return (
								containsNodeReference(value, removedSource.nodeId) ||
								(isJsonContent(value) &&
									value.includes(`"id":"${removedSource.nodeId}"`))
							);
						}
						return false;
					});

					if (!hasReference) {
						continue;
					}

					// Clean up all string fields
					let hasChanges = false;
					const updatedContent = { ...node.content };
					for (const [key, value] of Object.entries(node.content)) {
						if (typeof value === "string" && value.length > 0) {
							const cleaned = cleanupNodeReferencesInText(
								value,
								removedSource.nodeId,
							);
							if (cleaned !== value) {
								(updatedContent as Record<string, unknown>)[key] = cleaned;
								hasChanges = true;
							}
						}
					}

					// Update node if changes were made
					if (hasChanges) {
						workflowDesignerRef.current.updateNodeData(node, {
							content: updatedContent,
						} as Partial<typeof node>);
					}
				}
			}

			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const deleteConnectionWithCleanup = useCallback(
		(connectionId: ConnectionId) => {
			const currentWorkspace = workflowDesignerRef.current.getData();
			const connection = currentWorkspace.connections.find(
				(conn) => conn.id === connectionId,
			);

			if (connection) {
				// Create a SourceNode object for the specific connection being removed
				const removedSource: SourceNode = {
					nodeId: connection.outputNode.id,
					outputId: connection.outputId,
				};

				// Clean up references to this specific connection in all text fields
				for (const node of currentWorkspace.nodes) {
					const hasReference = Object.values(node.content).some((value) => {
						if (typeof value === "string" && value.length > 0) {
							return (
								containsSpecificNodeReference(
									value,
									removedSource.nodeId,
									removedSource.outputId,
								) ||
								(isJsonContent(value) &&
									value.includes(`"id":"${removedSource.nodeId}"`) &&
									value.includes(`"outputId":"${removedSource.outputId}"`))
							);
						}
						return false;
					});

					if (!hasReference) {
						continue;
					}

					// Clean up all string fields
					let hasChanges = false;
					const updatedContent = { ...node.content };
					for (const [key, value] of Object.entries(node.content)) {
						if (typeof value === "string" && value.length > 0) {
							const cleaned = cleanupSpecificNodeReferenceInText(
								value,
								removedSource.nodeId,
								removedSource.outputId,
							);
							if (cleaned !== value) {
								(updatedContent as Record<string, unknown>)[key] = cleaned;
								hasChanges = true;
							}
						}
					}

					// Update node if changes were made
					if (hasChanges) {
						workflowDesignerRef.current.updateNodeData(node, {
							content: updatedContent,
						} as Partial<typeof node>);
					}
				}
			}

			// Perform the actual connection deletion
			workflowDesignerRef.current.deleteConnection(connectionId);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const deleteNode = useCallback(
		async (nodeId: NodeId | string) => {
			const deletedNode = workflowDesignerRef.current.deleteNode(nodeId);
			if (deletedNode) {
				handleDeleteNodeCleanup(nodeId);
				await handleDeleteTriggerCleanup(deletedNode);
			}
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace, handleDeleteNodeCleanup, handleDeleteTriggerCleanup],
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
				deleteConnectionWithCleanup,
				handleSourceRemoved,
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
				{children}
			</GenerationRunnerSystemProvider>
		</WorkflowDesignerContext.Provider>
	);
}
