import type { FileContent, FileData, FileNode } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore } from "../hooks";
import { useUpdateFileStatus } from "./use-update-file-status";

export function useRemoveFile() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.id);
	const store = useAppDesignerStoreApi();
	const updateFileStatus = useUpdateFileStatus();

	return useCallback(
		async (file: FileData) => {
			const allNodes = store.getState().nodes;
			const parentNode = allNodes.find(
				(n) =>
					n.content.type === "file" &&
					(n.content as FileContent).files?.some(
						(f: FileData) => f.id === file.id,
					),
			) as FileNode | undefined;

			// Remove from storage only for uploaded files; otherwise just update state
			if (file.status === "uploaded") {
				await client.removeFile({
					workspaceId,
					fileId: file.id,
				});
			}

			// If the parent node is still present in state, reflect the deletion
			if (parentNode) {
				const currentFiles = parentNode.content.files;
				updateFileStatus(
					parentNode.id,
					currentFiles.filter((f) => f.id !== file.id),
				);
			}
		},
		[client, store, updateFileStatus, workspaceId],
	);
}
