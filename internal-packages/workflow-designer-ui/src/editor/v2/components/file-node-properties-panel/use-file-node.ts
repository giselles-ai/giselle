import type {
	FileData,
	FileNode,
	UploadedFileData,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback } from "react";
import { useToasts } from "../../../../ui/toast";

export function useFileNode(node: FileNode) {
	const {
		updateNodeDataContent,
		uploadFile,
		removeFile: removeFileInternal,
	} = useWorkflowDesigner();
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
		async (file: FileData) => {
			// Update node content for all file statuses
			updateNodeDataContent(node, {
				files: node.content.files.filter((f) => f.id !== file.id),
			});

			await removeFileInternal(file as UploadedFileData);
		},
		[node, updateNodeDataContent, removeFileInternal],
	);

	return {
		addFiles,
		removeFile,
	};
}
