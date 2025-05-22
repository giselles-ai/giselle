import FirecrawlApp, {
	type ErrorResponse,
	type ScrapeResponse,
} from "@mendable/firecrawl-js";
import { z } from "zod";

export const firecrawlProviderName = "firecrawl" as const;

export const FirecrawlWebSearchProvider = z.object({
	provider: z.literal(firecrawlProviderName),
});

export type FirecrawlWebSearchProvider = z.infer<
	typeof FirecrawlWebSearchProvider
>;

export const ALLOWED_SCRAPE_FORMATS = ["markdown", "html"] as const;

export type AllowedScrapeFormats = (typeof ALLOWED_SCRAPE_FORMATS)[number];

export type FirecrawlScrapeResult = {
	url: string;
	title: string;
	html: string;
	markdown: string;
};

export async function scrapeUrl(
	url: string,
	formats: AllowedScrapeFormats[] = [...ALLOWED_SCRAPE_FORMATS],
	apiKey = process.env.FIRECRAWL_API_KEY || "",
): Promise<FirecrawlScrapeResult> {
	try {
		new URL(url);
	} catch {
		throw new Error(`Invalid URL: ${url}`);
	}
	const firecrawlApp = new FirecrawlApp({ apiKey });
	const timeoutMs = 10000;
	const timeoutPromise: Promise<never> = new Promise((_, reject) =>
		setTimeout(
			() => reject(new Error("Request timed out after 10 seconds")),
			timeoutMs,
		),
	);
	const response = (await Promise.race([
		firecrawlApp.scrapeUrl(url, { formats: formats }),
		timeoutPromise,
	])) as ScrapeResponse | ErrorResponse;
	if (!response.success) {
		throw new Error(`Failed to scrape: ${(response as ErrorResponse).error}`);
	}
	const doc = response as ScrapeResponse;
	return {
		url,
		title: doc.metadata?.title || "",
		html: doc.html || "",
		markdown: doc.markdown || "",
	};
}
