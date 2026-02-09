"use client";

import {
	App,
	type AppId,
	type Connection,
	isAppEntryNode,
	isEndNode,
	type NodeId,
	type NodeLike,
} from "@giselles-ai/protocol";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from "react";
import { useAppDesignerStoreApi } from "./app-designer-provider";
import { useGiselle } from "./giselle-client-provider";

type LastSavedAppConnectionState = {
	appId: AppId;
	workspaceId: App["workspaceId"];
	entryNodeId: NodeId;
	state: App["state"];
	endNodeId?: NodeId;
};

function findReachableEndNodeId(args: {
	nodes: NodeLike[];
	connections: Connection[];
	startNodeId: NodeId;
}): NodeId | undefined {
	const { nodes, connections, startNodeId } = args;

	const endNodeIdSet = new Set<NodeId>(
		nodes.filter((node) => isEndNode(node)).map((node) => node.id),
	);
	if (endNodeIdSet.size === 0) return;

	const adjacencyList = new Map<NodeId, Set<NodeId>>();
	for (const connection of connections) {
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

function omitEndNodeId(app: App): Omit<App, "endNodeId"> {
	if (app.state === "connected") {
		const { endNodeId: _unused, ...rest } = app;
		return rest;
	}
	return app;
}

const AppConnectionStateSyncContext = createContext<(() => void) | null>(null);

export function AppConnectionStateSyncProvider({
	children,
}: React.PropsWithChildren) {
	const client = useGiselle();
	const store = useAppDesignerStoreApi();

	const lastSavedRef = useRef<LastSavedAppConnectionState | null>(null);
	const tailRef = useRef<Promise<void>>(Promise.resolve());

	const runSyncNow = useCallback(async () => {
		const state = store.getState();

		const appEntryNode = state.nodes.find(
			(node) => isAppEntryNode(node) && node.content.status === "configured",
		);
		if (!appEntryNode || !isAppEntryNode(appEntryNode)) {
			lastSavedRef.current = null;
			return;
		}
		if (appEntryNode.content.status !== "configured") {
			lastSavedRef.current = null;
			return;
		}

		const endNodeId = findReachableEndNodeId({
			nodes: state.nodes,
			connections: state.connections,
			startNodeId: appEntryNode.id,
		});
		const desiredState: App["state"] = endNodeId ? "connected" : "disconnected";

		const last = lastSavedRef.current;
		if (
			last &&
			last.appId === appEntryNode.content.appId &&
			last.workspaceId === state.workspaceId &&
			last.entryNodeId === appEntryNode.id &&
			last.state === desiredState &&
			last.endNodeId === endNodeId
		) {
			return;
		}

		try {
			const res = await client.getApp({ appId: appEntryNode.content.appId });

			const appLike =
				desiredState === "connected"
					? ({
							...res.app,
							state: "connected",
							entryNodeId: appEntryNode.id,
							workspaceId: state.workspaceId,
							endNodeId,
						} satisfies Partial<App>)
					: ({
							...omitEndNodeId(res.app),
							state: "disconnected",
							entryNodeId: appEntryNode.id,
							workspaceId: state.workspaceId,
						} satisfies Partial<App>);

			const parseResult = App.safeParse(appLike);
			if (!parseResult.success) {
				console.error(
					"Failed to derive connected/disconnected app state:",
					parseResult.error,
				);
				return;
			}

			await client.saveApp({ app: parseResult.data });
			lastSavedRef.current = {
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
	}, [client, store]);

	const syncAppConnectionStateIfNeeded = useCallback(() => {
		tailRef.current = tailRef.current.then(runSyncNow).catch((error) => {
			console.error("App connection sync queue failed:", error);
		});
	}, [runSyncNow]);

	useEffect(() => {
		// Ensure initial state is synced once after mount/init.
		syncAppConnectionStateIfNeeded();
	}, [syncAppConnectionStateIfNeeded]);

	return (
		<AppConnectionStateSyncContext.Provider
			value={syncAppConnectionStateIfNeeded}
		>
			{children}
		</AppConnectionStateSyncContext.Provider>
	);
}

export function useSyncAppConnectionStateIfNeededContext() {
	const fn = useContext(AppConnectionStateSyncContext);
	if (!fn) {
		throw new Error(
			"Missing AppConnectionStateSyncProvider in the tree. Ensure it is mounted inside AppDesignerProvider.",
		);
	}
	return fn;
}
