import type { FileData, Workspace } from "@giselle-sdk/data-type";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFeatureFlag } from "../feature-flags";
import {
	type GiselleRequestOptions,
	useGiselleEngine,
} from "../use-giselle-engine";
import { WorkflowDesignerContext } from "./context";
import { type AppStore, isSupportedConnection, useAppStore } from "./hooks";
import type { WorkflowDesignerContextValue } from "./types";

const DEFAULT_SAVE_DELAY = 1000;

interface WorkspaceAutoSaveOptions {
	client: ReturnType<typeof useGiselleEngine>;
	experimentalStorage: boolean;
	saveWorkflowDelay: number;
}

function useWorkspaceAutoSave({
	client,
	experimentalStorage,
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
						useExperimentalStorage: experimentalStorage,
					},
					requestOptions,
				);
			} catch (error) {
				console.error("Failed to persist workspace:", error);
			}
		},
		[client, experimentalStorage],
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
		const unsubscribe = useAppStore.subscribe((state, prevState) => {
			if (state._skipNextSave) {
				useAppStore.setState({ _skipNextSave: false } as Partial<AppStore>);
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
			const currentState = useAppStore.getState();
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

	const { saveImmediately } = useWorkspaceAutoSave({
		client,
		experimentalStorage: experimental_storage,
		saveWorkflowDelay,
	});

	// Initialize or update workspace in the global store when data changes
	useEffect(() => {
		useAppStore.getState().initWorkspace(data);
	}, [data]);

	// Load LLM providers
	useEffect(() => {
		const loadProviders = async () => {
			useAppStore.getState().setIsLoading(true);
			try {
				const providers = await client.getLanguageModelProviders();
				useAppStore.getState().setLLMProviders(providers);
			} catch (error) {
				console.error("Failed to load language model providers:", error);
			} finally {
				useAppStore.getState().setIsLoading(false);
			}
		};
		loadProviders();
	}, [client]);

	useEffect(() => {
		const handleBeforeUnload = () => {
			saveImmediately({ keepalive: true });
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [saveImmediately]);

	// Get current state
	const state = useAppStore();

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
				state.uploadFile(
					client,
					data.id,
					experimental_storage,
					files,
					node,
					options,
				),
			removeFile: (file: FileData) =>
				state.removeFile(client, data.id, experimental_storage, file),
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
		[
			state,
			textGenerationApi,
			client,
			data,
			experimental_storage,
			saveImmediately,
		],
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
