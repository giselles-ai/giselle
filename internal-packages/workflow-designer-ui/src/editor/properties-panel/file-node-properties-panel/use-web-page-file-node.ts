import type {
	FileData,
	FileNode,
	WebPageContent,
} from "@giselle-sdk/data-type";
import { FileId } from "@giselle-sdk/data-type";
import { type WebSearchResult, webSearch } from "@giselle-sdk/web-search";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback, useState } from "react";

function createFileDataFromWebPage(
	result: WebSearchResult,
	format: "html" | "markdown",
): FileData {
	const content = format === "markdown" ? result.markdown : result.html;
	const now = Date.now();
	return {
		id: FileId.generate(),
		name: result.url,
		type: format === "markdown" ? "text/markdown" : "text/html",
		size: new Blob([content]).size,
		status: "uploaded",
		uploadedAt: now,
	};
}

function createWebPageContentFromResult(
	result: WebSearchResult,
	format: "html" | "markdown",
): WebPageContent {
	return {
		type: "webPage",
		url: result.url,
		format,
		file: createFileDataFromWebPage(result, format),
		status: "completed",
	};
}

function createFileFromWebSearchResult(
	url: string,
	result: WebSearchResult,
	format: "html" | "markdown",
): File {
	const content = format === "markdown" ? result.markdown : result.html;
	const mimeType = format === "markdown" ? "text/markdown" : "text/html";
	const fileName = `${url} (Format: ${format === "markdown" ? "Markdown" : "HTML"})`;
	return new File([content], fileName, { type: mimeType });
}

export function useWebPageFileNode(node: FileNode) {
	const { isLoading, updateNodeDataContent, uploadFile } =
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
			const selfMadeWebSearch = webSearch({ provider: "self-made" });
			const newWebPages: WebPageContent[] = [];
			const filesToUpload: File[] = [];
			for (const url of urlList) {
				try {
					const result = await selfMadeWebSearch.fetchUrl(url, [format]);
					const file = createFileFromWebSearchResult(url, result, format);
					filesToUpload.push(file);
					const webPageContent = createWebPageContentFromResult(result, format);
					newWebPages.push(webPageContent);
				} catch (e) {
					setUrlError("Failed to fetch one or more URLs.");
				}
			}
			// Upload files using uploadFile
			if (filesToUpload.length > 0) {
				await uploadFile(filesToUpload, node, {
					onError: (errorMessage) => {
						setUrlError(errorMessage);
					},
				});
			}

			// Update node content for all file statuses
			updateNodeDataContent(node, {
				type: "file",
				category: "webPage",
				files: newWebPages.map((wp) => wp.file),
			});
		} catch (error) {
			setUrlError("Failed to fetch one or more URLs.");
		}
	}, [urls, format, node, updateNodeDataContent, uploadFile]);

	const onRemoveFile = useCallback(
		(file: FileData) => {
			if (!node.content || !Array.isArray(node.content.files)) return;
			updateNodeDataContent(node, {
				type: "file",
				category: "webPage",
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
