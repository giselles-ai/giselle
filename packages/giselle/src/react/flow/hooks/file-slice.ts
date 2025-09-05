import {
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileContent,
	type FileData,
	type FileNode,
	type UploadedFileData,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import type { StateCreator } from "zustand";
import { APICallError } from "../../errors";
import type { GiselleEngineClient } from "../../use-giselle-engine";
import type { AppStore } from "./store";

export interface FileSlice {
	uploadFile: (
		client: GiselleEngineClient,
		workspaceId: WorkspaceId,
		useExperimentalStorage: boolean,
		files: File[],
		node: FileNode,
		options?: { onError?: (error: string) => void },
	) => Promise<void>;
	removeFile: (
		client: GiselleEngineClient,
		workspaceId: WorkspaceId,
		useExperimentalStorage: boolean,
		uploadedFile: UploadedFileData,
	) => Promise<void>;
}

export const createFileSlice: StateCreator<AppStore, [], [], FileSlice> = (
	_set,
	get,
) => ({
	uploadFile: async (
		client,
		workspaceId,
		useExperimentalStorage,
		files,
		node,
		options,
	) => {
		const uploaders = files.map((file) => {
			return async () => {
				const initialFiles = get().workspace?.nodes.find(
					(n) => n.id === node.id,
				)?.content.files as FileData[] | undefined;

				if (!initialFiles) return; // Node not found or content is wrong type

				if (initialFiles.some((f) => f.name === file.name)) {
					options?.onError?.("duplicate file name");
					return;
				}

				const uploadingFileData = createUploadingFileData({
					name: file.name,
					type: file.type,
					size: file.size,
				});

				// Show uploading status immediately
				get().updateFileStatus(node.id, [...initialFiles, uploadingFileData]);

				try {
					await client.uploadFile({
						workspaceId: workspaceId,
						file,
						fileId: uploadingFileData.id,
						fileName: file.name,
						useExperimentalStorage: useExperimentalStorage,
					});

					const uploadedFileData = createUploadedFileData(
						uploadingFileData,
						Date.now(),
					);

					const filesAfterUpload = get().workspace?.nodes.find(
						(n) => n.id === node.id,
					)?.content.files as FileData[] | undefined;

					get().updateFileStatus(node.id, [
						...(filesAfterUpload?.filter((f) => f.id !== uploadedFileData.id) ||
							[]),
						uploadedFileData,
					]);
				} catch (error) {
					const message = APICallError.isInstance(error)
						? error.statusCode === 413
							? "filesize too large"
							: error.message
						: "upload failed";

					options?.onError?.(message);
					const failedFileData = createFailedFileData(
						uploadingFileData,
						message,
					);

					const filesAfterError = get().workspace?.nodes.find(
						(n) => n.id === node.id,
					)?.content.files as FileData[] | undefined;

					get().updateFileStatus(node.id, [
						...(filesAfterError?.filter((f) => f.id !== failedFileData.id) ||
							[]),
						failedFileData,
					]);
				}
			};
		});

		for (const uploader of uploaders) {
			await uploader();
		}
	},
	removeFile: async (
		client,
		workspaceId,
		useExperimentalStorage,
		uploadedFile,
	) => {
		const allNodes = get().workspace?.nodes ?? [];
		const parentNode = allNodes.find(
			(n) =>
				n.content.type === "file" &&
				(n.content as FileContent).files?.some(
					(f: FileData) => f.id === uploadedFile.id,
				),
		) as FileNode | undefined;

		if (!parentNode) {
			console.error("Could not find parent node for file to remove");
			return;
		}

		await client.removeFile({
			workspaceId: workspaceId,
			fileId: uploadedFile.id,
			useExperimentalStorage: useExperimentalStorage,
		});

		const currentFiles = parentNode.content.files;

		if (currentFiles) {
			get().updateFileStatus(
				parentNode.id,
				currentFiles.filter((f) => f.id !== uploadedFile.id),
			);
		}
	},
});
