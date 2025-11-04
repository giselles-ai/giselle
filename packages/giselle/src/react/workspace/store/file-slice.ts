import {
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileContent,
	type FileData,
	type FileNode,
	isFileNode,
	type WorkspaceId,
} from "@giselle-ai/data-type";
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

		// Remove from storage only for uploaded files; otherwise just update state
		if (file.status === "uploaded") {
			await client.removeFile({
				workspaceId: workspaceId,
				fileId: file.id,
			});
		}

		// If the parent node is still present in state, reflect the deletion
		if (parentNode) {
			const currentFiles = parentNode.content.files;
			get().updateFileStatus(
				parentNode.id,
				currentFiles.filter((f) => f.id !== file.id),
			);
		}
	},
});
