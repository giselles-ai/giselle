import {
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileData,
	type FileNode,
	isFileNode,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore } from "../hooks";
import { useUpdateFileStatus } from "./use-update-file-status";

/**
 * Hard limit to upload file since Vercel Serverless Functions have a 4.5MB body size limit.
 * @see internal-packages/workflow-designer-ui/src/editor/properties-panel/file-node-properties-panel/file-panel.tsx
 */
const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 4.5;

function formatFileSize(size: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let formattedSize = size;
	let i = 0;
	while (formattedSize >= 1024 && i < units.length - 1) {
		formattedSize /= 1024;
		i++;
	}
	return `${formattedSize} ${units[i]}`;
}

function getFileSizeExceededMessage(maxSizeBytes: number) {
	return `File size exceeds the limit. Please upload a file smaller than ${formatFileSize(maxSizeBytes)}.`;
}

function isLikelyOversizeErrorMessage(message: string) {
	const m = message.toLowerCase();
	return (
		m.includes("413") ||
		m.includes("payload too large") ||
		m.includes("bodySizeLimit".toLowerCase()) ||
		m.includes("request body") ||
		m.includes("body size")
	);
}

export function useUploadFile() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const store = useAppDesignerStoreApi();
	const updateFileStatus = useUpdateFileStatus();

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

				if (file.size > MAX_UPLOAD_SIZE_BYTES) {
					const message = getFileSizeExceededMessage(MAX_UPLOAD_SIZE_BYTES);
					options?.onError?.(message);
					const failedFileData = createFailedFileData(
						uploadingFileData,
						message,
					);
					fileContents = [
						...getCurrentFiles().filter((f) => f.id !== failedFileData.id),
						failedFileData,
					];
					updateFileStatus(node.id, fileContents);
					continue;
				}

				try {
					const formData = new FormData();
					formData.append("workspaceId", workspaceId);
					formData.append("fileId", uploadingFileData.id);
					formData.append("fileName", name);
					formData.append("file", file);
					await client.uploadFile(formData);

					const uploadedFileData = createUploadedFileData(
						uploadingFileData,
						Date.now(),
					);
					fileContents = [
						...getCurrentFiles().filter((f) => f.id !== uploadedFileData.id),
						uploadedFileData,
					];
				} catch (error) {
					const message =
						error instanceof Error
							? isLikelyOversizeErrorMessage(error.message)
								? getFileSizeExceededMessage(MAX_UPLOAD_SIZE_BYTES)
								: error.message || "upload failed"
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
