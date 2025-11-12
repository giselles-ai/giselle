import { isClonedFileDataPayload } from "@giselles-ai/node-registry";
import {
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileContent,
	type FileData,
	type FileNode,
	isFileNode,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import { APICallError } from "../../errors";
import type { GiselleEngineClient } from "../../use-giselle-engine";
import type { AppStore } from "./store";

export interface FileSlice {
	uploadFile: (
		client: GiselleEngineClient,
		workspaceId: WorkspaceId,
		files: File[],
		node: FileNode,
		options?: { onError?: (error: string) => void },
	) => Promise<void>;
	removeFile: (
		client: GiselleEngineClient,
		workspaceId: WorkspaceId,
		file: FileData,
	) => Promise<void>;
}

export const createFileSlice: StateCreator<AppStore, [], [], FileSlice> = (
	_set,
	get,
) => ({
	uploadFile: async (client, workspaceId, files, node, options) => {
		const getCurrentFiles = (): FileData[] => {
			const ws = get().workspace;
			if (!ws) return [];
			const found = ws.nodes.find((n) => n.id === node.id);
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
			get().updateFileStatus(node.id, fileContents);

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

				const failedFileData = createFailedFileData(uploadingFileData, message);
				fileContents = [
					...getCurrentFiles().filter((f) => f.id !== failedFileData.id),
					failedFileData,
				];
			}
			get().updateFileStatus(node.id, fileContents);
		}
	},
	removeFile: async (client, workspaceId, file) => {
		const allNodes = get().workspace?.nodes ?? [];
		const parentNode = allNodes.find(
			(n) =>
				n.content.type === "file" &&
				(n.content as FileContent).files?.some(
					(f: FileData) => f.id === file.id,
				),
		) as FileNode | undefined;

		if (parentNode === undefined) {
			return;
		}

		// Get the actual file ID in storage (for cloned files, use the original ID)
		const actualFileId = isClonedFileDataPayload(file)
			? file.originalFileIdForCopy
			: file.id;

		// Count how many nodes reference this file (excluding the current deletion)
		let referenceCount = 0;
		for (const node of allNodes) {
			if (!isFileNode(node)) {
				continue;
			}

			for (const f of node.content.files) {
				// Skip the file being deleted from the current node
				if (node.id === parentNode.id && f.id === file.id) {
					continue;
				}

				// Get the file ID this file references
				const refFileId = isClonedFileDataPayload(f)
					? f.originalFileIdForCopy
					: f.id;

				if (refFileId === actualFileId) {
					referenceCount++;
				}
			}
		}

		// Only remove from storage if no other nodes reference this file
		if (referenceCount === 0 && file.status === "uploaded") {
			await client.removeFile({
				workspaceId: workspaceId,
				fileId: actualFileId,
			});
		}

		// Always remove from UI state
		const currentFiles = parentNode.content.files;
		get().updateFileStatus(
			parentNode.id,
			currentFiles.filter((f) => f.id !== file.id),
		);
	},
});
