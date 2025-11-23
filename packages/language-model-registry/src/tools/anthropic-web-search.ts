import * as z from "zod/v4";
import { defineLanguageModelTool } from "./tool";

export const anthropicWebSearch = defineLanguageModelTool({
	name: "anthropic-web-search",
	title: "Anthropic Web Search",
	provider: "anthropic",
	configurationOptions: {
		maxUses: {
			name: "maxUses",
			schema: z.number().min(1).max(10),
		},
		allowedDomains: {
			name: "allowedDomains",
			schema: z.array(z.string()).optional(),
		},
		blockedDomains: {
			name: "blockedDomains",
			schema: z.array(z.string()).optional(),
		},
	},
});
