import { useToasts } from "@giselle-internal/ui/toast";
import type { FileData, FileNode } from "@giselles-ai/protocol";
import { useCallback } from "react";
import {
	useRemoveFile,
	useUploadFile,
} from "../../../app-designer/store/usecases";

export function useFileNode(node: FileNode) {
	const uploadFile = useUploadFile();
	const removeFileInternal = useRemoveFile();
	const { error } = useToasts();
	const addFiles = useCallback(
		async (files: File[]) => {
			await uploadFile(files, node, {
				onError: (errorMessage) => {
					error(errorMessage);
				},
			});
		},
		[node, uploadFile, error],
	);

	const removeFile = useCallback(
		async (file: FileData) => await removeFileInternal(file),
		[removeFileInternal],
	);

	return {
		addFiles,
		removeFile,
	};
}
