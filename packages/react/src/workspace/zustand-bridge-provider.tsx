import {
	App,
	type AppEntryNode,
	AppId,
	type FileData,
	type FileNode,
	isAppEntryNode,
	isEndNode,
	type NodeId,
	type NodeLike,
	type Workspace,
} from "@giselles-ai/protocol";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type GiselleRequestOptions, useGiselle } from "../use-giselle";
import { WorkflowDesignerContext } from "./context";
import { type AppStore, appStore } from "./store";
import type { WorkflowDesignerContextValue } from "./types";
import { isSupportedConnection } from "./utils";

const DEFAULT_SAVE_DELAY = 1000;

interface WorkspaceAutoSaveOptions {
	client: ReturnType<typeof useGiselle>;
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

function findReachableEndNodeId(workspace: Workspace, startNodeId: NodeId) {
	const endNodeIdSet = new Set<NodeId>(
		workspace.nodes.filter((node) => isEndNode(node)).map((node) => node.id),
	);
	if (endNodeIdSet.size === 0) return;

	const adjacencyList = new Map<NodeId, Set<NodeId>>();
	for (const connection of workspace.connections) {
		const fromNodeId = connection.outputNode.id;
		const toNodeId = connection.inputNode.id;
		const destinations = adjacencyList.get(fromNodeId) ?? new Set<NodeId>();
		destinations.add(toNodeId);
		adjacencyList.set(fromNodeId, destinations);
	}

	const visited = new Set<NodeId>([startNodeId]);
	const queue: NodeId[] = [startNodeId];

	while (queue.length > 0) {
		const currentNodeId = queue.shift();
		if (!currentNodeId) continue;

		if (endNodeIdSet.has(currentNodeId)) {
			return currentNodeId;
		}

		const nextNodeIds = adjacencyList.get(currentNodeId);
		if (!nextNodeIds) continue;

		for (const nextNodeId of nextNodeIds) {
			if (visited.has(nextNodeId)) continue;
			visited.add(nextNodeId);
			queue.push(nextNodeId);
		}
	}
}

function useAppConnectionStateSync({
	client,
}: {
	client: ReturnType<typeof useGiselle>;
}) {
	const lastSyncedRef = useRef<{
		appId: AppId;
		workspaceId: Workspace["id"];
		entryNodeId: NodeId;
		state: App["state"];
		endNodeId?: NodeId;
	} | null>(null);

	const isScheduledRef = useRef(false);

	const syncNow = useCallback(async () => {
		const workspace = appStore.getState().workspace;
		if (!workspace) {
			lastSyncedRef.current = null;
			return;
		}

		const appEntryNode = workspace.nodes.find(
			(node): node is AppEntryNode =>
				isAppEntryNode(node) && node.content.status === "configured",
		);
		if (!appEntryNode || appEntryNode.content.status !== "configured") {
			lastSyncedRef.current = null;
			return;
		}

		const endNodeId = findReachableEndNodeId(workspace, appEntryNode.id);
		const desiredState: App["state"] = endNodeId ? "connected" : "disconnected";

		const last = lastSyncedRef.current;
		if (
			last &&
			last.appId === appEntryNode.content.appId &&
			last.workspaceId === workspace.id &&
			last.entryNodeId === appEntryNode.id &&
			last.state === desiredState &&
			last.endNodeId === endNodeId
		) {
			return;
		}

		try {
			const res = await client.getApp({
				appId: appEntryNode.content.appId,
			});

			const appLike =
				desiredState === "connected"
					? ({
							...res.app,
							state: "connected",
							entryNodeId: appEntryNode.id,
							workspaceId: workspace.id,
							endNodeId,
						} satisfies Partial<App>)
					: (() => {
							if (res.app.state === "connected") {
								// Ensure disconnected state does not accidentally keep endNodeId.
								const { endNodeId: _unused, ...rest } = res.app;
								return {
									...rest,
									state: "disconnected",
									entryNodeId: appEntryNode.id,
									workspaceId: workspace.id,
								} satisfies Partial<App>;
							}
							return {
								...res.app,
								state: "disconnected",
								entryNodeId: appEntryNode.id,
								workspaceId: workspace.id,
							} satisfies Partial<App>;
						})();

			const parseResult = App.safeParse(appLike);
			if (!parseResult.success) {
				console.error(
					"Failed to derive connected/disconnected app state:",
					parseResult.error,
				);
				return;
			}

			await client.saveApp({ app: parseResult.data });
			lastSyncedRef.current = {
				appId: parseResult.data.id,
				workspaceId: parseResult.data.workspaceId,
				entryNodeId: parseResult.data.entryNodeId,
				state: parseResult.data.state,
				endNodeId:
					parseResult.data.state === "connected"
						? parseResult.data.endNodeId
						: undefined,
			};
		} catch (error) {
			console.error("Failed to sync app connection state:", error);
		}
	}, [client]);

	const scheduleSync = useCallback(() => {
		if (isScheduledRef.current) return;
		isScheduledRef.current = true;
		queueMicrotask(() => {
			isScheduledRef.current = false;
			void syncNow();
		});
	}, [syncNow]);

	useEffect(() => {
		// Ensure initial state is synced once after mount/init.
		scheduleSync();
	}, [scheduleSync]);

	return {
		onAddConnection: scheduleSync,
		onDeleteConnection: scheduleSync,
		onInitWorkspace: scheduleSync,
	};
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
	const client = useGiselle();

	const autoConfigureAppEntryNode = useCallback(
		async (node: NodeLike) => {
			if (!isAppEntryNode(node)) {
				return;
			}

			if (node.content.status !== "unconfigured") {
				console.warn("Node is not unconfigured");
				return;
			}
			const workspace = appStore.getState().workspace;
			if (!workspace) return;

			const appId = AppId.generate();
			const draftApp = node.content.draftApp;
			const appLike: App = {
				id: appId,
				version: "v1",
				state: "disconnected",
				description: draftApp.description ?? "",
				parameters: draftApp.parameters,
				entryNodeId: node.id,
				workspaceId: workspace.id,
			};
			console.log(appLike);
			const parseResult = App.safeParse(appLike);
			if (!parseResult.success) {
				console.error(
					"Failed to auto configure app entry node:",
					parseResult.error,
				);
				return;
			}

			try {
				await client.saveApp({ app: parseResult.data });
			} catch (error) {
				console.error(
					"Failed to persist auto configured app entry node:",
					error,
				);
				return;
			}

			const nextState = appStore.getState();
			const existingNode = nextState.workspace?.nodes.find(
				(workspaceNode) => workspaceNode.id === node.id,
			);
			if (existingNode === undefined) {
				return;
			}

			nextState.updateNodeData(existingNode as AppEntryNode, {
				content: {
					type: "appEntry",
					status: "configured",
					appId,
				},
			});
		},
		[client],
	);

	const handleNodeAdded = useCallback(
		(node: NodeLike) => {
			void autoConfigureAppEntryNode(node);
			onAddNode?.(node);
		},
		[autoConfigureAppEntryNode, onAddNode],
	);

	const { saveImmediately } = useWorkspaceAutoSave({
		client,
		saveWorkflowDelay,
	});

	const { onAddConnection, onDeleteConnection, onInitWorkspace } =
		useAppConnectionStateSync({ client });

	// Initialize or update workspace in the global store when data changes
	useEffect(() => {
		appStore.getState().initWorkspace(data, {
			onAddNode: handleNodeAdded,
			onUpdateNode,
			onDeleteNode,
			onAddConnection,
			onDeleteConnection,
		});
		onInitWorkspace();
	}, [
		data,
		handleNodeAdded,
		onUpdateNode,
		onDeleteNode,
		onAddConnection,
		onDeleteConnection,
		onInitWorkspace,
	]);

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

	const deleteNode = useCallback<WorkflowDesignerContextValue["deleteNode"]>(
		async (nodeId) => {
			const currentWorkspace = appStore.getState().workspace;
			if (currentWorkspace === null) {
				return;
			}
			const targetNode = currentWorkspace.nodes.find(
				(node) => node.id === nodeId,
			);
			if (targetNode === undefined) {
				return;
			}
			console.debug("delete node", targetNode);
			state.deleteNode(nodeId);
			if (
				isAppEntryNode(targetNode) &&
				targetNode.content.status === "configured"
			) {
				await client.deleteApp({ appId: targetNode.content.appId });
				await saveImmediately();
			}
		},
		[state, client, saveImmediately],
	);

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
			deleteNode,
			deleteConnection: state.deleteConnection,
			uploadFile: (files, node, options) =>
				state.uploadFile(client, data.id, files, node, options),
			removeFile: (file: FileData) => state.removeFile(client, data.id, file),
			copyFiles: (node: FileNode) => state.copyFiles(client, data.id, node),
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
		[state, textGenerationApi, client, data, saveImmediately, deleteNode],
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
