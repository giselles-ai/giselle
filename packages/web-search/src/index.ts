import { z } from "zod";
import { FirecrawlWebSearchProvider, firecrawlProviderName } from "./firecrawl";
import { SelfMadeWebSearchProvider, selfMadeProviderName } from "./self-made";
export { websearch } from "./websearch";

export { scrapeUrl as firecrawlScrapeUrl } from "./firecrawl";
export { scrapeUrl as selfMadeScrapeUrl } from "./self-made";

export const WebSearchProviderSchema = z.union([
	FirecrawlWebSearchProvider,
	SelfMadeWebSearchProvider,
]);

export type WebSearchProvider = z.infer<typeof WebSearchProviderSchema>;

export const WebSearchProviders = z.enum([
	firecrawlProviderName,
	selfMadeProviderName,
]);
