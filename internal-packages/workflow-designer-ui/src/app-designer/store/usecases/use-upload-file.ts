import {
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileData,
	type FileNode,
	isFileNode,
} from "@giselles-ai/protocol";
import { APICallError } from "@giselles-ai/react";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore, useWorkspaceActions } from "../hooks";

export function useUploadFile() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.id);
	const store = useAppDesignerStoreApi();
	const { updateFileStatus } = useWorkspaceActions((s) => ({
		updateFileStatus: s.updateFileStatus,
	}));

	return useCallback(
		async (
			files: File[],
			node: FileNode,
			options?: { onError?: (error: string) => void },
		) => {
			const getCurrentFiles = (): FileData[] => {
				const current = store.getState();
				const found = current.nodes.find((n) => n.id === node.id);
				if (found && isFileNode(found)) {
					return found.content.files;
				}
				return [];
			};

			let fileContents = getCurrentFiles();
			const batchSeen = new Set<string>();

			for (const file of files) {
				const name = file.name;
				const currentNames = new Set<string>([
					...getCurrentFiles().map((f) => f.name),
					...fileContents.map((f) => f.name),
				]);
				const isDuplicate = batchSeen.has(name) || currentNames.has(name);
				if (isDuplicate) {
					options?.onError?.(`duplicate file name: ${name}`);
					continue;
				}
				batchSeen.add(name);

				const uploadingFileData = createUploadingFileData({
					name,
					type: file.type,
					size: file.size,
				});
				fileContents = [...fileContents, uploadingFileData];
				updateFileStatus(node.id, fileContents);

				try {
					await client.uploadFile({
						workspaceId,
						file,
						fileId: uploadingFileData.id,
						fileName: name,
					});

					const uploadedFileData = createUploadedFileData(
						uploadingFileData,
						Date.now(),
					);
					fileContents = [
						...getCurrentFiles().filter((f) => f.id !== uploadedFileData.id),
						uploadedFileData,
					];
				} catch (error) {
					const message = APICallError.isInstance(error)
						? error.statusCode === 413
							? "filesize too large"
							: error.message
						: error instanceof Error
							? error.message || "upload failed"
							: "upload failed";
					options?.onError?.(message);

					const failedFileData = createFailedFileData(
						uploadingFileData,
						message,
					);
					fileContents = [
						...getCurrentFiles().filter((f) => f.id !== failedFileData.id),
						failedFileData,
					];
				}
				updateFileStatus(node.id, fileContents);
			}
		},
		[client, store, updateFileStatus, workspaceId],
	);
}
