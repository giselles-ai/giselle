import * as z from "zod/v4";
import { defineLanguageModelTool } from "./tool";

function isValidDomain(domain: string): { isValid: boolean; message?: string } {
	if (!domain.trim()) {
		return { isValid: false, message: "Domain cannot be empty" };
	}
	const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
	if (!domainRegex.test(domain)) {
		return { isValid: false, message: "Invalid domain format" };
	}
	return { isValid: true };
}

export const openaiWebSearch = defineLanguageModelTool({
	name: "openai-web-search",
	title: "OpenAI Web Search",
	provider: "openai",
	configurationOptions: {
		allowedDomains: {
			name: "allowedDomains",
			title: "Allowed Domains",
			type: "tagArray",
			validate: isValidDomain,
			optional: true,
			schema: z.array(z.string()).optional(),
		},
	},
});
