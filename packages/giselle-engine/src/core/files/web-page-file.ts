import type { FileData } from "@giselle-sdk/data-type";
import { FileId as FileIdGenerator } from "@giselle-sdk/data-type";
import type { AllowedFormats, WebSearchResult } from "@giselle-sdk/web-search";
import { webSearch } from "@giselle-sdk/web-search";

export interface WebPageFileResult {
	content: string;
	fileName: string;
	mimeType: string;
	fileData: FileData;
	webSearchResult: WebSearchResult;
}

export async function fetchWebPageFiles(args: {
	urls: string[];
	format: AllowedFormats;
	provider?: "self-made" | "firecrawl";
}): Promise<WebPageFileResult[]> {
	const { urls, format, provider = "self-made" } = args;
	const search = webSearch({ provider });
	const results: WebPageFileResult[] = [];
	for (const url of urls) {
		const result = await search.fetchUrl(url, [format]);
		const content = format === "markdown" ? result.markdown : result.html;
		const mimeType = format === "markdown" ? "text/markdown" : "text/html";
		const fileName = `${url} (Format: ${format === "markdown" ? "Markdown" : "HTML"})`;
		const now = Date.now();
		const fileData: FileData = {
			id: FileIdGenerator.generate(),
			name: result.url,
			type: mimeType,
			size: content.length, // size in characters (not bytes)
			status: "uploaded",
			uploadedAt: now,
		};
		results.push({
			content,
			fileName,
			mimeType,
			fileData,
			webSearchResult: result,
		});
	}
	return results;
}
