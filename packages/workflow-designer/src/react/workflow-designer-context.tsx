"use client";

import {
	type ConnectionId,
	type FileNode,
	type LLMProvider,
	type Node,
	type NodeId,
	type NodeUIState,
	type UploadedFileData,
	type Viewport,
	type Workspace,
	createUploadedFileData,
	createUploadingFileData,
} from "@giselle-sdk/data-type";
import { GenerationRunnerSystemProvider } from "@giselle-sdk/generation-runner/react";
import { runAssistant } from "@giselle-sdk/giselle-engine/schema";
import { RunSystemContextProvider } from "@giselle-sdk/run/react";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { WorkflowDesigner } from "../workflow-designer";
import { usePropertiesPanel, useView } from "./state";

export interface WorkflowDesignerContextValue
	extends Pick<
			WorkflowDesigner,
			| "addNode"
			| "updateNodeData"
			| "addConnection"
			| "deleteConnection"
			| "removeFile"
			| "setUiViewport"
			| "updateName"
		>,
		ReturnType<typeof usePropertiesPanel>,
		ReturnType<typeof useView> {
	data: Workspace;
	textGenerationApi: string;
	runAssistantApi: string;
	setUiNodeState: (
		nodeId: string | NodeId,
		ui: Partial<NodeUIState>,
		options?: { save?: boolean },
	) => void;
	updateNodeDataContent: <T extends Node>(
		node: T,
		content: Partial<T["content"]>,
	) => void;
	uploadFile: (files: File[], node: FileNode) => Promise<void>;
	deleteNode: (nodeId: NodeId | string) => void;
	llmProviders: LLMProvider[];
	isLoading: boolean;
}
export const WorkflowDesignerContext = createContext<
	WorkflowDesignerContextValue | undefined
>(undefined);

type Timer = ReturnType<typeof setTimeout>;
export function WorkflowDesignerProvider({
	children,
	data,
	saveWorkflowApi = "/api/giselle/save-workspace",
	textGenerationApi = "/api/giselle/text-generation",
	runAssistantApi = runAssistant.defaultApi,
	saveWorkflowDelay: defaultSaveWorkflowDelay = 1000,
}: {
	children: React.ReactNode;
	data: Workspace;
	saveWorkflowApi?: string;
	textGenerationApi?: string;
	runAssistantApi?: string;
	saveWorkflowDelay?: number;
}) {
	const workflowDesignerRef = useRef(
		WorkflowDesigner({
			defaultValue: data,
			saveWorkflowApi,
		}),
	);
	const [workspace, setWorkspaceInternal] = useState(data);
	const persistTimeoutRef = useRef<Timer | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [llmProviders, setLLMProviders] = useState<LLMProvider[]>([]);

	useEffect(() => {
		workflowDesignerRef.current
			.getAvailableLLMProviders()
			.then(setLLMProviders)
			.then(() => setIsLoading(false));
	}, []);

	const saveWorkspace = useCallback(async () => {
		try {
			await workflowDesignerRef.current.saveWorkspace();
		} catch (error) {
			console.error("Failed to persist graph:", error);
		}
	}, []);

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
		(nodeData: Omit<Node, "id">, options?: { ui?: NodeUIState }) => {
			workflowDesignerRef.current.addNode(nodeData, options);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const updateNodeData = useCallback(
		<T extends Node>(node: T, data: Partial<T>) => {
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
		async (files: File[], node: FileNode) => {
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
							contentType: file.type,
							size: file.size,
						});
						fileContents = [...fileContents, uploadingFileData];

						updateNodeDataContent(node, {
							files: fileContents,
						});
						const result = await workflowDesignerRef.current.uploadFile(
							file,
							uploadingFileData.id,
						);

						const uploadedFileData = createUploadedFileData(
							uploadingFileData,
							Date.now(),
							result.generatedTitle,
						);
						fileContents = [
							...fileContents.filter((file) => file.id !== uploadedFileData.id),
							uploadedFileData,
						];
						updateNodeDataContent(node, {
							files: fileContents,
						});
					};
				}),
			);
		},
		[updateNodeDataContent],
	);

	const removeFile = useCallback(
		async (uploadedFile: UploadedFileData) => {
			await workflowDesignerRef.current.removeFile(uploadedFile);
			setAndSaveWorkspace();
		},
		[setAndSaveWorkspace],
	);

	const usePropertiesPanelHelper = usePropertiesPanel();
	const useViewHelper = useView();

	return (
		<WorkflowDesignerContext.Provider
			value={{
				data: workspace,
				textGenerationApi,
				runAssistantApi,
				addNode,
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
