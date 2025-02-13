import FirecrawlApp from "@mendable/firecrawl-js";
import { apiKeyEnvVar } from "./const";

let firecrawlApp: FirecrawlApp;
export const getApp = (): FirecrawlApp => {
	if (firecrawlApp != null) {
		return firecrawlApp;
	}
	const firecrawlApiKey = process.env[apiKeyEnvVar];
	if (firecrawlApiKey === undefined) {
		throw new Error(`${apiKeyEnvVar} is required`);
	}
	firecrawlApp = new FirecrawlApp({ apiKey: firecrawlApiKey });
	return getApp();
};
