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
		let pendingSaveState: AppStore | null = null;
		let inFlightSave: Promise<void> | null = null;

		const performSave = async (
			state: AppStore,
			options?: { keepalive?: boolean },
		) => {
			if (!state.workspace) return;
			const payload = {
				workspace: state.workspace,
				useExperimentalStorage: experimental_storage,
			};
			if (options?.keepalive) {
				try {
					const serialized = JSON.stringify(payload);
					const endpoint = `${client.basePath}/updateWorkspace`;
					if (typeof navigator !== "undefined" && navigator.sendBeacon) {
						const beaconSent = navigator.sendBeacon(
							endpoint,
							new Blob([serialized], { type: "application/json" }),
						);
						if (beaconSent) {
							return;
						}
					}
					if (typeof fetch !== "undefined") {
						await fetch(endpoint, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: serialized,
							keepalive: true,
						});
						return;
					}
				} catch (error) {
					console.error(
						"Keepalive workspace save failed, falling back to async save:",
						error,
					);
				}
			}
			try {
				await client.updateWorkspace(payload);
			} catch (error) {
				console.error("Failed to persist workspace:", error);
			}
		};

		const clearPendingSave = () => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
				saveTimeout = null;
			}
		};

		const flushPendingSave = (options?: { keepalive?: boolean }) => {
			const stateToSave = pendingSaveState;
			pendingSaveState = null;
			clearPendingSave();
			if (!stateToSave) return;
			const saveTask = (async () => {
				if (inFlightSave) {
					try {
						await inFlightSave;
					} catch (error) {
						console.error("Previous workspace save failed:", error);
					}
				}
				await performSave(stateToSave, options);
			})();
			inFlightSave = saveTask;
			void saveTask.finally(() => {
				if (inFlightSave === saveTask) {
					inFlightSave = null;
				}
			});
		};

		const scheduleAutoSave = (state: AppStore) => {
			pendingSaveState = state;
			if (saveTimeout) clearTimeout(saveTimeout);
			saveTimeout = setTimeout(() => {
				flushPendingSave();
			}, saveWorkflowDelay);
		};

		const unsubscribe = useAppStore.subscribe((state, prevState) => {
			if (state._skipNextSave) {
				flushPendingSave();
				useAppStore.setState({ _skipNextSave: false } as Partial<AppStore>);
				return;
			}
			if (state.workspace !== prevState.workspace) {
				scheduleAutoSave(state);
			}
		});

		const handleBeforeUnload = () => {
			flushPendingSave({ keepalive: true });
		};
		const handlePageHide = () => {
			flushPendingSave({ keepalive: true });
		};
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				flushPendingSave({ keepalive: true });
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("pagehide", handlePageHide);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("pagehide", handlePageHide);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			flushPendingSave();
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
