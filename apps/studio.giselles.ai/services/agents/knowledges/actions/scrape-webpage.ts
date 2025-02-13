"use server";

import { scrapeWebpage as firecrawlScrape } from "@/services/external/firecrawl";

interface Title {
	text: string;
	level: number;
}

function extractFirstTitle(markdown: string): Title | null {
	// This regex matches Markdown headers (both ATX and Setext styles)
	const headerRegex = /^(#{1,6})\s+(.+)$|^(.+)\n([=\-]{2,})$/gm;
	const match = headerRegex.exec(markdown);

	if (match) {
		if (match[1]) {
			// ATX-style header (e.g., # Header)
			return {
				text: match[2].trim(),
				level: match[1].length,
			};
		}
		// Setext-style header (e.g., Header\n======)
		return {
			text: match[3].trim(),
			level: match[4][0] === "=" ? 1 : 2,
		};
	}

	return null;
}

export const scrapeWebpage = async (url: string) => {
	const scrapedData = await firecrawlScrape(url);
	if (!scrapedData.success) {
		return { success: false, error: scrapedData.error } as const;
	}
	const markdown = scrapedData.markdown;
	if (markdown == null) {
		return { success: false, error: "parse failed" } as const;
	}
	const title =
		scrapedData.metadata?.title ?? extractFirstTitle(markdown)?.text ?? url;
	return {
		...scrapedData,
		markdown,
		title,
	};
};
