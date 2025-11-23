import * as z from "zod/v4";
import { defineLanguageModelTool } from "./tool";

export const openaiWebSearch = defineLanguageModelTool({
	name: "openai-web-search",
	title: "OpenAI Web Search",
	provider: "openai",
	configurationOptions: {
		searchContextSize: {
			name: "searchContextSize",
			schema: z.enum(["low", "medium", "high"]).optional(),
		},
		userLocation: {
			name: "userLocation",
			schema: z
				.object({
					type: z.literal("approximate"),
					country: z.string().optional(),
					city: z.string().optional(),
					region: z.string().optional(),
					timezone: z.string().optional(),
				})
				.optional(),
		},
		filters: {
			name: "filters",
			schema: z
				.object({
					allowedDomains: z.array(z.string()).optional(),
				})
				.optional(),
		},
	},
});
