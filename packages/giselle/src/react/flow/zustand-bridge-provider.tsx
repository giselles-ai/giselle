import type { FileData, Workspace } from "@giselle-sdk/data-type";
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
		let hasPendingSave = false;
		let isSaving = false;
		let isEffectActive = true;

		let pendingWorkspace: Workspace | null = null;

		const snapshotWorkspace = (workspace: Workspace | null) => {
			if (!workspace) return null;
			if (typeof structuredClone === "function") {
				return structuredClone(workspace) as Workspace;
			}
			return JSON.parse(JSON.stringify(workspace)) as Workspace;
		};

		const processPendingSave = () => {
			if (!isEffectActive) return;
			saveTimeout = null;
			if (isSaving) {
				if (!saveTimeout) {
					saveTimeout = setTimeout(processPendingSave, saveWorkflowDelay);
				}
				return;
			}
			if (!pendingWorkspace) {
				hasPendingSave = false;
				return;
			}
			const workspaceToSave = pendingWorkspace;
			pendingWorkspace = null;
			hasPendingSave = false;
			performSave(workspaceToSave);
		};

		const scheduleAutoSave = (state: AppStore) => {
			if (!isEffectActive || state._skipNextSave) return;
			pendingWorkspace = snapshotWorkspace(state.workspace ?? null);
			if (!pendingWorkspace) return;
			hasPendingSave = true;
			if (saveTimeout) clearTimeout(saveTimeout);
			saveTimeout = setTimeout(processPendingSave, saveWorkflowDelay);
		};

		const performSave = async (workspace: Workspace) => {
			if (isSaving) return;
			isSaving = true;
			let didFail = false;
			try {
				await client.updateWorkspace({
					workspace,
					useExperimentalStorage: experimental_storage,
				});
			} catch (error) {
				console.error("Failed to persist workspace:", error);
				didFail = true;
			} finally {
				isSaving = false;
				if (isEffectActive) {
					if (didFail) {
						pendingWorkspace = snapshotWorkspace(workspace);
						hasPendingSave = true;
					}
					if (hasPendingSave && !saveTimeout) {
						saveTimeout = setTimeout(processPendingSave, saveWorkflowDelay);
					}
				}
			}
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
			isEffectActive = false;
			if (saveTimeout) {
				clearTimeout(saveTimeout);
				saveTimeout = null;
			}
			if (hasPendingSave && !isSaving && pendingWorkspace) {
				const workspaceToSave = pendingWorkspace;
				pendingWorkspace = null;
				hasPendingSave = false;
				performSave(workspaceToSave);
			}
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
