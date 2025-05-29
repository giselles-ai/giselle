"use client";
import type { FileData, FileNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback, useState } from "react";

export function useWebPageFileNode(node: FileNode) {
	const { isLoading, updateNodeDataContent, uploadFile, fetchWebPageFiles } =
		useWorkflowDesigner();
	const [urls, setUrls] = useState("");
	const [format, setFormat] = useState<"html" | "markdown">("markdown");
	const [urlError, setUrlError] = useState("");

	// onFetch now uploads web page content as files using uploadFile, and updates webPages metadata for display
	const onFetch = useCallback(async () => {
		const urlList = urls
			.split("\n")
			.map((u) => u.trim())
			.filter((u: string) => Boolean(u));
		if (urlList.length === 0) return;
		setUrlError("");

		try {
			const webPageFileResults = await fetchWebPageFiles({
				urls: urlList,
				format,
			});

			// Convert content string to File for browser upload
			const filesToUpload = webPageFileResults.map((r) => {
				const blob = new Blob([r.content], { type: r.mimeType });
				return new File([blob], r.fileName, { type: r.mimeType });
			});
			const fileDataList = webPageFileResults.map((r) => r.fileData);

			if (filesToUpload.length > 0) {
				await uploadFile(filesToUpload, node, {
					onError: (errorMessage) => {
						setUrlError(errorMessage);
					},
				});
			}

			// Update node content for all file statuses
			updateNodeDataContent(node, {
				files: fileDataList,
			});
		} catch (error) {
			setUrlError("Failed to fetch one or more URLs.");
		}
	}, [
		urls,
		format,
		node,
		updateNodeDataContent,
		uploadFile,
		fetchWebPageFiles,
	]);

	const onRemoveFile = useCallback(
		(file: FileData) => {
			if (!node.content || !Array.isArray(node.content.files)) return;
			updateNodeDataContent(node, {
				files: node.content.files.filter((f: FileData) => f.id !== file.id),
			});
		},
		[node, updateNodeDataContent],
	);

	return {
		urls,
		setUrls,
		format,
		setFormat,
		isLoading,
		onFetch,
		onRemoveFile,
		files:
			node.content && Array.isArray(node.content.files)
				? node.content.files
				: [],
		urlError,
	};
}
