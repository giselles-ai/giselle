import { useWorkflowDesigner } from "@giselle-ai/giselle/react";
import type { FileData, FileNode } from "@giselle-ai/protocol";
import { useToasts } from "@giselle-internal/ui/toast";
import { useCallback } from "react";

export function useFileNode(node: FileNode) {
	const { uploadFile, removeFile: _removeFile } = useWorkflowDesigner();
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
		async (file: FileData) => await _removeFile(file),
		[_removeFile],
	);

	return {
		addFiles,
		removeFile,
	};
}
