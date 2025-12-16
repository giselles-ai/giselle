import type { FileData, FileNode, NodeId } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useUpdateNodeDataContent } from "./use-update-node-data-content";

export function useUpdateFileStatus() {
	const store = useAppDesignerStoreApi();
	const updateNodeDataContent = useUpdateNodeDataContent();
	return useCallback(
		(
			nodeId: NodeId,
			files: FileData[] | ((files: FileData[]) => FileData[]),
		) => {
			const node = store.getState().nodes.find((n) => n.id === nodeId) as
				| FileNode
				| undefined;
			if (!node || node.content.type !== "file") return;

			const currentFiles = node.content.files;
			const nextFiles =
				typeof files === "function" ? files(currentFiles) : files;
			updateNodeDataContent<FileNode>(node, { files: nextFiles });
		},
		[store, updateNodeDataContent],
	);
}
