import { z } from "zod/v4";
import { SelfMadeWebSearchProvider, selfMadeProviderName } from "./self-made";
export { type WebSearchResult, webSearch } from "./web-search";
export { scrapeUrl as selfMadeScrapeUrl } from "./self-made";

export const WebSearchProviderSchema = SelfMadeWebSearchProvider;

export type WebSearchProvider = z.infer<typeof WebSearchProviderSchema>;

export const WebSearchProviders = z.enum([selfMadeProviderName]);
export type WebSearchProviders = z.infer<typeof WebSearchProviders>;
