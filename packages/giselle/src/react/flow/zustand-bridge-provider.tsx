import type {
	FileNode,
	UploadedFileData,
	Workspace,
} from "@giselle-sdk/data-type";
import { useEffect, useMemo } from "react";
import { useFeatureFlag } from "../feature-flags";
import { useGiselleEngine } from "../use-giselle-engine";
import { WorkflowDesignerContext } from "./context";
import { type AppStore, isSupportedConnection, useAppStore } from "./hooks";
import type { WorkflowDesignerContextValue } from "./types";

const DEFAULT_SAVE_DELAY = 1000;

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

	// Subscribe to global store changes for auto-save
	useEffect(() => {
		let saveTimeout: ReturnType<typeof setTimeout> | null = null;

		const performSave = async (state: AppStore) => {
			if (!state.workspace) return;
			try {
				await client.updateWorkspace({
					workspace: state.workspace,
					useExperimentalStorage: experimental_storage,
				});
			} catch (error) {
				console.error("Failed to persist workspace:", error);
			}
		};

		const scheduleAutoSave = (state: AppStore) => {
			if (state._skipNextSave) return;
			if (saveTimeout) clearTimeout(saveTimeout);
			saveTimeout = setTimeout(() => performSave(state), saveWorkflowDelay);
		};

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
			if (saveTimeout) clearTimeout(saveTimeout);
			unsubscribe();
		};
	}, [client, experimental_storage, saveWorkflowDelay]);

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
			uploadFile: (files: File[], node: FileNode) =>
				state.uploadFile(client, data.id, experimental_storage, files, node),
			removeFile: (uploadedFile: UploadedFileData) =>
				state.removeFile(client, data.id, experimental_storage, uploadedFile),
			llmProviders: state.llmProviders,
			isLoading: state.isLoading,
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
		[state, textGenerationApi, client, data, experimental_storage],
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
