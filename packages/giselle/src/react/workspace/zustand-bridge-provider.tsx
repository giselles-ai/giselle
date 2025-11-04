import type { FileData, NodeLike, Workspace } from "@giselle-ai/data-type";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
	type GiselleRequestOptions,
	useGiselleEngine,
} from "../use-giselle-engine";
import { WorkflowDesignerContext } from "./context";
import { type AppStore, appStore } from "./store";
import type { WorkflowDesignerContextValue } from "./types";
import { isSupportedConnection } from "./utils";

const DEFAULT_SAVE_DELAY = 1000;

interface WorkspaceAutoSaveOptions {
	client: ReturnType<typeof useGiselleEngine>;
	saveWorkflowDelay: number;
}

export interface WorkspaceCallbackOptions {
	onAddNode?: (node: NodeLike) => void;
	onUpdateNode?: (node: NodeLike) => void;
	onDeleteNode?: (node: NodeLike) => void;
}

function useWorkspaceAutoSave({
	client,
	saveWorkflowDelay,
}: WorkspaceAutoSaveOptions) {
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearScheduledSave = useCallback(() => {
		if (!saveTimeoutRef.current) return;
		clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = null;
	}, []);

	const performSave = useCallback(
		async (state: AppStore, requestOptions?: GiselleRequestOptions) => {
			if (!state.workspace) return;
			try {
				await client.updateWorkspace(
					{
						workspace: state.workspace,
					},
					requestOptions,
				);
			} catch (error) {
				console.error("Failed to persist workspace:", error);
			}
		},
		[client],
	);

	const scheduleAutoSave = useCallback(
		(state: AppStore) => {
			if (state._skipNextSave) return;
			clearScheduledSave();
			saveTimeoutRef.current = setTimeout(() => {
				void performSave(state);
			}, saveWorkflowDelay);
		},
		[clearScheduledSave, performSave, saveWorkflowDelay],
	);

	useEffect(() => {
		const unsubscribe = appStore.subscribe((state, prevState) => {
			if (state._skipNextSave) {
				appStore.setState({ _skipNextSave: false } as Partial<AppStore>);
				return;
			}
			if (state.workspace !== prevState.workspace) {
				scheduleAutoSave(state);
			}
		});

		return () => {
			clearScheduledSave();
			unsubscribe();
		};
	}, [clearScheduledSave, scheduleAutoSave]);

	const saveImmediately = useCallback(
		async (requestOptions?: GiselleRequestOptions) => {
			const currentState = appStore.getState();
			if (!currentState.workspace) return;
			clearScheduledSave();
			await performSave(currentState, requestOptions);
		},
		[clearScheduledSave, performSave],
	);

	return { saveImmediately };
}

export function ZustandBridgeProvider({
	children,
	data,
	textGenerationApi = "/api/giselle/text-generation",
	saveWorkflowDelay = DEFAULT_SAVE_DELAY,
	onAddNode,
	onUpdateNode,
	onDeleteNode,
}: {
	children: React.ReactNode;
	data: Workspace;
	saveWorkflowApi?: string;
	textGenerationApi?: string;
	runAssistantApi?: string;
	saveWorkflowDelay?: number;
} & WorkspaceCallbackOptions) {
	const client = useGiselleEngine();

	const { saveImmediately } = useWorkspaceAutoSave({
		client,
		saveWorkflowDelay,
	});

	// Initialize or update workspace in the global store when data changes
	useEffect(() => {
		appStore
			.getState()
			.initWorkspace(data, { onAddNode, onUpdateNode, onDeleteNode });
	}, [data, onAddNode, onUpdateNode, onDeleteNode]);

	// Load LLM providers
	useEffect(() => {
		const loadProviders = async () => {
			appStore.getState().setIsLoading(true);
			try {
				const providers = await client.getLanguageModelProviders();
				appStore.getState().setLLMProviders(providers);
			} catch (error) {
				console.error("Failed to load language model providers:", error);
			} finally {
				appStore.getState().setIsLoading(false);
			}
		};
		loadProviders();
	}, [client]);

	useEffect(() => {
		function handleBeforeUnload() {
			saveImmediately({ keepalive: true });
		}

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [saveImmediately]);

	// Get current state
	const state = appStore();

	// Create context value that matches the existing API
	const contextValue = useMemo<WorkflowDesignerContextValue>(
		() => ({
			data: state.workspace ?? data,
			textGenerationApi,
			addNode: (node, options) => state.addNode(node, options?.ui),
			copyNode: state.copyNode,
			addConnection: (args) => state.addConnection(args),
			updateNodeData: (node, data) => state.updateNode(node.id, data),
			updateNodeDataContent: (node, content) =>
				state.updateNodeDataContent(node, content),
			setUiNodeState: state.setUiNodeState,
			deleteNode: state.deleteNode,
			deleteConnection: state.deleteConnection,
			uploadFile: (files, node, options) =>
				state.uploadFile(client, data.id, files, node, options),
			removeFile: (file: FileData) => state.removeFile(client, data.id, file),
			llmProviders: state.llmProviders,
			isLoading: state.isLoading,
			saveWorkspace: saveImmediately,
			setUiViewport: state.setUiViewport,
			updateName: state.updateWorkspaceName,
			isSupportedConnection,
			setCurrentShortcutScope: state.setCurrentShortcutScope,
			copiedNode: state.copiedNode,
			setCopiedNode: state.setCopiedNode,
			propertiesTab: state.propertiesTab,
			setPropertiesTab: state.setPropertiesTab,
			openPropertiesPanel: state.openPropertiesPanel,
			setOpenPropertiesPanel: state.setOpenPropertiesPanel,
		}),
		[state, textGenerationApi, client, data, saveImmediately],
	);

	// Wait for workspace to be initialized
	if (!state.workspace) {
		return null;
	}

	return (
		<WorkflowDesignerContext.Provider value={contextValue}>
			{children}
		</WorkflowDesignerContext.Provider>
	);
}
