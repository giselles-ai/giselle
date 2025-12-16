import {
	isWebPageNode,
	type NodeId,
	type WebPageId,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore } from "../hooks";
import { useUpdateNodeDataContent } from "./use-update-node-data-content";

export function useRemoveWebPage() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.id);
	const store = useAppDesignerStoreApi();
	const updateNodeDataContent = useUpdateNodeDataContent();

	return useCallback(
		async (args: { nodeId: NodeId; webpageId: WebPageId }) => {
			const node = store.getState().nodes.find((n) => n.id === args.nodeId);
			if (!isWebPageNode(node)) {
				return;
			}

			const webpage = node.content.webpages.find(
				(w) => w.id === args.webpageId,
			);
			if (!webpage) return;

			updateNodeDataContent(node, {
				webpages: node.content.webpages.filter((w) => w.id !== args.webpageId),
			});

			if (webpage.status === "fetched") {
				await client.removeFile({
					workspaceId,
					fileId: webpage.fileId,
				});
			}
		},
		[client, store, updateNodeDataContent, workspaceId],
	);
}
