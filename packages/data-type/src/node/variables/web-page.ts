import { z } from "zod/v4";
import { FileData } from "./file";

export const WebPageContent = z.object({
	type: z.literal("webPage"),
	url: z.url().min(1),
	format: z.enum(["html", "markdown"]).default("html"),
	file: FileData,
	status: z.enum(["idle", "fetching", "completed", "failed"]).default("idle"),
});
export type WebPageContent = z.infer<typeof WebPageContent>;
