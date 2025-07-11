import {
	type selfMadeProviderName,
	scrapeUrl as selfMadeScrapeUrl,
} from "./self-made";

type AllowedFormats = "html" | "markdown";

interface WebSearchConfig {
	provider: typeof selfMadeProviderName;
}

export type WebSearchResult = {
	url: string;
	title: string;
	html: string;
	markdown: string;
};

interface WebSearchTool {
	fetchUrl: (
		url: string,
		formats?: AllowedFormats[],
	) => Promise<WebSearchResult>;
}

// The `_config` parameter is currently unused but retained for potential future functionality.
export function webSearch(_config: WebSearchConfig): WebSearchTool {
	return {
		fetchUrl: (url: string, formats?: AllowedFormats[]) =>
			selfMadeScrapeUrl(url, formats),
	};
}
