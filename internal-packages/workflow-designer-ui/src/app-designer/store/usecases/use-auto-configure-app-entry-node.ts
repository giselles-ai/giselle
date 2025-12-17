import {
	App,
	AppId,
	type App as AppType,
	isAppEntryNode,
	type NodeLike,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useUpdateNodeData } from "./use-update-node-data";

export function useAutoConfigureAppEntryNode() {
	const client = useGiselle();
	const store = useAppDesignerStoreApi();
	const updateNodeData = useUpdateNodeData();

	return useCallback(
		async (node: NodeLike) => {
			if (!isAppEntryNode(node)) {
				return;
			}

			if (node.content.status !== "unconfigured") {
				return;
			}

			const { workspaceId } = store.getState();
			const appId = AppId.generate();
			const draftApp = node.content.draftApp;

			const appLike: AppType = {
				id: appId,
				version: "v1",
				state: "disconnected",
				description: draftApp.description ?? "",
				parameters: draftApp.parameters,
				entryNodeId: node.id,
				workspaceId,
			};

			const parseResult = App.safeParse(appLike);
			if (!parseResult.success) {
				console.error(
					"Failed to auto-configure app entry node:",
					parseResult.error,
				);
				return;
			}

			try {
				await client.saveApp({ app: parseResult.data });
			} catch (error) {
				console.error("Failed to persist auto-configured App:", error);
				return;
			}

			const nextState = store.getState();
			const existingNode = nextState.nodes.find((n) => n.id === node.id);
			if (!existingNode || !isAppEntryNode(existingNode)) {
				return;
			}
			if (existingNode.content.status !== "unconfigured") {
				return;
			}

			updateNodeData(existingNode, {
				content: {
					type: "appEntry",
					status: "configured",
					appId,
				},
			});
		},
		[client, store, updateNodeData],
	);
}
