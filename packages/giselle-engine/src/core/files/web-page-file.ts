import type {
	FileData,
	WebPageFileResult,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import {
	FileId as FileIdGenerator,
	createUploadedFileData,
	createUploadingFileData,
} from "@giselle-sdk/data-type";
import { webSearch } from "@giselle-sdk/web-search";
import type { GiselleEngineContext } from "../types";
import { uploadFile } from "./upload-file";

export async function fetchWebPageFiles(args: {
	urls: string[];
	format: "markdown" | "html";
	provider?: "self-made";
}): Promise<WebPageFileResult[]> {
	const { urls, format, provider = "self-made" } = args;
	const search = webSearch({ provider });
	const results: WebPageFileResult[] = [];
	for (const url of urls) {
		const result = await search.fetchUrl(url, [format]);

		const content = format === "markdown" ? result.markdown : result.html;
		const mimeType = format === "markdown" ? "text/markdown" : "text/html";
		const fileName = result.url;
		const fileData: FileData = {
			id: FileIdGenerator.generate(),
			name: fileName,
			type: mimeType,
			size: new Blob([content]).size, // size in bytes
			status: "uploading",
		};
		results.push({
			url: result.url,
			content,
			fileName,
			mimeType,
			fileData,
		});
	}
	return results;
}

function sanitizeFileName(name: string): string {
	return name
		.replace(/[\\/:*?"<>|]/g, "")
		.replace(/\s+/g, "-")
		.toLowerCase()
		.slice(0, 100);
}

export async function fetchWebPageFile(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	url: string;
	format: "markdown" | "html";
	provider?: "self-made";
}): Promise<WebPageFileResult> {
	const { context, workspaceId, url, format, provider = "self-made" } = args;
	const search = webSearch({ provider });
	const result = await search.fetchUrl(url, [format]);

	const content = format === "markdown" ? result.markdown : result.html;
	const mimeType = format === "markdown" ? "text/markdown" : "text/html";
	const baseName = sanitizeFileName(result.title || url);
	const extension = format === "markdown" ? ".md" : ".html";
	const fileName = `${baseName || "page"}${extension}`;

	const uploadingFileData = createUploadingFileData({
		name: fileName,
		type: mimeType,
		size: new Blob([content]).size,
	});
	const blob = new Blob([content], { type: mimeType });
	const file = new File([blob], fileName, { type: mimeType });

	await uploadFile({
		context,
		workspaceId,
		file,
		fileId: uploadingFileData.id,
		fileName,
	});

	const fileData: FileData = createUploadedFileData(
		uploadingFileData,
		Date.now(),
	);

	return {
		url: result.url,
		content,
		fileName,
		mimeType,
		fileData,
	};
}
