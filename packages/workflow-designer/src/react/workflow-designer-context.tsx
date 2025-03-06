"use client";

import {
	type ConnectionId,
	type FileNode,
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
import { useGiselleEngine } from "@giselle-sdk/giselle-engine/react";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
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
			| "setUiViewport"
			| "updateName"
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
	uploadFile: (files: File[], node: FileNode) => Promise<void>;
	removeFile: (uploadedFile: UploadedFileData) => Promise<void>;
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
		[updateNodeDataContent, client, data.id],
	);

	const removeFile = useCallback(
		async (uploadedFile: UploadedFileData) => {
			await client.removeFile({
				workspaceId: data.id,
				fileId: uploadedFile.id,
				fileName: uploadedFile.name,
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
