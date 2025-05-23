import {
	firecrawlProviderName,
	scrapeUrl as firecrawlScrapeUrl,
} from "./firecrawl";
import {
	type selfMadeProviderName,
	scrapeUrl as selfMadeScrapeUrl,
} from "./self-made";

export type AllowedFormats = "html" | "markdown";

export interface WebsearchConfigFirecrawl {
	provider: typeof firecrawlProviderName;
	apiKey?: string;
}

export interface WebsearchConfigSelfMade {
	provider: typeof selfMadeProviderName;
}

export type WebsearchConfig =
	| WebsearchConfigFirecrawl
	| WebsearchConfigSelfMade;

export type WebSearchResult = {
	url: string;
	title: string;
	html: string;
	markdown: string;
};

export interface WebsearchTool {
	fetchUrl: (
		url: string,
		formats?: AllowedFormats[],
	) => Promise<WebSearchResult>;
}

export function websearch(config: WebsearchConfig): WebsearchTool {
	if (config.provider === firecrawlProviderName) {
		return {
			fetchUrl: (url: string, formats?: AllowedFormats[]) =>
				firecrawlScrapeUrl(url, config.apiKey ?? "", formats),
		};
	}
	return {
		fetchUrl: (url: string, formats?: AllowedFormats[]) =>
			selfMadeScrapeUrl(url, formats),
	};
}
