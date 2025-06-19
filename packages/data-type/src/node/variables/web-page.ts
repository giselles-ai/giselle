import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";
import { FileId } from "./file";

export const WebPageId = createIdGenerator("wbpg");
export type WebPageId = z.infer<typeof WebPageId.schema>;

const WebPageBase = z.object({
	id: WebPageId.schema,
	url: z.url(),
	status: z.string(),
});

export const FetchingWebPage = WebPageBase.extend({
	status: z.literal("fetching"),
});
export type FetchingWebPage = z.infer<typeof FetchingWebPage>;

const FetchedWebPage = WebPageBase.extend({
	status: z.literal("fetched"),
	favicon: z.string(),
	title: z.string(),
	fileId: FileId.schema,
});
export type FetchedWebPage = z.infer<typeof FetchedWebPage>;

const FailedWebPage = WebPageBase.extend({
	status: z.literal("failed"),
	errorMessage: z.string(),
});
export type FailedWebPage = z.infer<typeof FailedWebPage>;

export const WebPage = z.discriminatedUnion("status", [
	FetchingWebPage,
	FetchedWebPage,
	FailedWebPage,
]);
export type WebPage = z.infer<typeof WebPage>;

export const WebPageContent = z.object({
	type: z.literal("webPage"),
	webpages: z.array(WebPage),
});
export type WebPageContent = z.infer<typeof WebPageContent>;

export const WebPageContentReference = z.object({
	type: WebPageContent.shape.type,
});
export type WebPageContentReference = z.infer<typeof WebPageContentReference>;
