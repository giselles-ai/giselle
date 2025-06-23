import {
	type FetchedWebPage,
	type FetchingWebPage,
	FileId,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { webSearch } from "@giselle-sdk/web-search";
import { filePath } from "../files/utils";
import type { GiselleEngineContext } from "../types";

export async function addWebPage(args: {
	webpage: FetchingWebPage;
	workspaceId: WorkspaceId;
	provider?: "self-made";
	context: GiselleEngineContext;
}) {
	try {
		const search = webSearch({ provider: args.provider ?? "self-made" });
		const result = await search.fetchUrl(args.webpage.url, ["markdown"]);

		// Validate the fetched content
		if (!result.markdown || result.markdown.trim().length === 0) {
			throw new Error(
				`Failed to fetch meaningful content from URL: ${args.webpage.url}. The page may be empty, require JavaScript, or be behind authentication.`,
			);
		}

		// Convert markdown to ArrayBuffer for storage compatibility
		const encoder = new TextEncoder();
		const arrayBuffer = encoder.encode(result.markdown);

		const fileId = FileId.generate();
		const storagePath = filePath({
			type: "workspace",
			id: args.workspaceId,
			fileId,
		});

		await args.context.storage.setItemRaw(storagePath, arrayBuffer, {
			contentType: "text/markdown",
		});

		const webpage: FetchedWebPage = {
			...args.webpage,
			status: "fetched",
			title: result.title || "Untitled",
			favicon: "",
			fileId,
		};

		return webpage;
	} catch (error) {
		// Re-throw with more context
		if (error instanceof Error) {
			throw new Error(
				`Web page fetch failed for ${args.webpage.url}: ${error.message}`,
			);
		}
		throw new Error(
			`Web page fetch failed for ${args.webpage.url}: Unknown error`,
		);
	}
}
