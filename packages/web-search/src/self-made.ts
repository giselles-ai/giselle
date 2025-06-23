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
	const content = await res.text();
	const contentType = res.headers.get("content-type") || "";

	// Check if the content is already plain text/markdown
	const normalizedUrl = url.toLowerCase();
	const isPlainText =
		contentType.includes("text/plain") ||
		contentType.includes("text/markdown") ||
		contentType.includes("text/x-markdown") ||
		contentType.includes("application/markdown") ||
		normalizedUrl.endsWith(".txt") ||
		normalizedUrl.endsWith(".md") ||
		!content.trim().startsWith("<");

	// Extract title from HTML (only if it's HTML content)
	const match = content.match(/<title>([\s\S]*?)<\/title>/i);
	const title = match ? match[1].trim() : url.split("/").pop() || "Untitled";

	let markdown = "";
	if (formats.includes("markdown")) {
		if (isPlainText) {
			// If it's already plain text/markdown, use it directly
			markdown = content;
		} else {
			// If it's HTML, convert it to markdown
			const Window = (await import("happy-dom")).Window;
			const window = new Window({ url });
			window.document.body.innerHTML = content;
			const Defuddle = (await import("defuddle/node")).Defuddle;
			const result = await Defuddle(window, url, {
				markdown: true,
			});
			markdown = result.content;
		}
	}

	return {
		url,
		title,
		html: formats.includes("html") ? content : "",
		markdown: formats.includes("markdown") ? markdown : "",
	};
}
