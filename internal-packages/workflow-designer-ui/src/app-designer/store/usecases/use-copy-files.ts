import {
	createCopyingFileData,
	createFailedFileData,
	createUploadedFileData,
	type FileData,
	type FileNode,
	isFileNode,
	type PendingCopyFileData,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore } from "../hooks";
import { useUpdateFileStatus } from "./use-update-file-status";

export function useCopyFiles() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.id);
	const store = useAppDesignerStoreApi();
	const updateFileStatus = useUpdateFileStatus();

	return useCallback(
		async (node: FileNode) => {
			const getCurrentFiles = (): FileData[] => {
				const current = store.getState();
				const found = current.nodes.find((n) => n.id === node.id);
				if (found && isFileNode(found)) {
					return found.content.files;
				}
				return [];
			};

			const filesToCopy = getCurrentFiles().filter(
				(f): f is PendingCopyFileData => f.status === "pending-copy",
			);

			await Promise.all(
				filesToCopy.map(async (fileData) => {
					const copyingFileData = createCopyingFileData(fileData);
					updateFileStatus(node.id, (currentFiles) =>
						currentFiles.map((f) =>
							f.id === fileData.id ? copyingFileData : f,
						),
					);

					try {
						await client.copyFile({
							workspaceId,
							sourceFileId: fileData.originalFileIdForCopy,
							destinationFileId: fileData.id,
						});

						const uploadedFileData = createUploadedFileData(
							copyingFileData,
							Date.now(),
						);
						updateFileStatus(node.id, (currentFiles) =>
							currentFiles.map((f) =>
								f.id === fileData.id ? uploadedFileData : f,
							),
						);
					} catch (error) {
						const message =
							error instanceof Error ? error.message : "Copy failed";
						const failedFileData = createFailedFileData(
							copyingFileData,
							message,
						);
						updateFileStatus(node.id, (currentFiles) =>
							currentFiles.map((f) =>
								f.id === fileData.id ? failedFileData : f,
							),
						);
					}
				}),
			);
		},
		[client, store, updateFileStatus, workspaceId],
	);
}
