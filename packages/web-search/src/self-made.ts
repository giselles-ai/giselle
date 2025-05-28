import TurndownService from "turndown";
import { z } from "zod";

export const selfMadeProviderName = "self-made" as const;

export const SelfMadeWebSearchProvider = z.object({
	provider: z.literal(selfMadeProviderName),
});

export type SelfMadeWebSearchProvider = z.infer<
	typeof SelfMadeWebSearchProvider
>;

export type SelfMadeScrapeResult = {
	url: string;
	title: string;
	html: string;
	markdown: string;
};

const turndownService = new TurndownService({
	headingStyle: "atx", // Use # heading style for headings
	codeBlockStyle: "fenced", // Use ``` fenced style for code blocks
	bulletListMarker: "*", // Use * as the bullet list marker
});

/**
 * Scrapes the content of a given URL and returns the result in the specified formats.
 *
 * @param {string} url - The URL to scrape. Must be a valid URL.
 * @param {("html" | "markdown")[]} [formats=["html"]] - An optional array specifying the desired output formats.
 *        - "html": Includes the raw HTML content.
 *        - "markdown": Includes the content converted to Markdown.
 * @returns {Promise<SelfMadeScrapeResult>} A promise resolving to an object containing the scraped URL, title, HTML, and/or Markdown.
 * @throws {Error} If the URL is invalid or if the fetch operation fails.
 */
export async function scrapeUrl(
	url: string,
	formats: ("html" | "markdown")[] = ["html"],
): Promise<SelfMadeScrapeResult> {
	try {
		new URL(url);
	} catch {
		throw new Error(`Invalid URL: ${url}`);
	}
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
	}
	const html = await res.text();
	// Extract title from HTML
	const match = html.match(/<title>([\s\S]*?)<\/title>/i);
	const title = match ? match[1].trim() : "";

	let markdown = "";
	if (formats.includes("markdown")) {
		markdown = turndownService.turndown(html);
	}

	return {
		url,
		title,
		html: formats.includes("html") ? html : "",
		markdown: formats.includes("markdown") ? markdown : "",
	};
}
