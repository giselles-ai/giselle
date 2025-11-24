import { defineLanguageModelTool } from "./tool";

function isValidDomain(domain: string): { isValid: boolean; message?: string } {
	if (!domain.trim()) {
		return { isValid: false, message: "Domain cannot be empty" };
	}
	// Basic domain validation
	const domainRegex =
		/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
	if (!domainRegex.test(domain)) {
		return { isValid: false, message: "Invalid domain format" };
	}
	return { isValid: true };
}

export const anthropicWebSearch = defineLanguageModelTool({
	name: "anthropic-web-search",
	title: "Anthropic Web Search",
	provider: "anthropic",
	configurationOptions: {
		maxUses: {
			name: "maxUses",
			type: "number",
			title: "Maximum Uses",
			min: 1,
			max: 10,
			step: 1,
			defaultValue: 1,
		},
		allowedDomains: {
			name: "allowedDomains",
			type: "tagArray",
			title: "Allowed Domains",
			placeholder: "Domain Names (separate with commas)",
			validate: isValidDomain,
		},
		blockedDomains: {
			name: "blockedDomains",
			type: "tagArray",
			title: "Blocked Domains",
			placeholder: "Domain Names (separate with commas)",
			validate: isValidDomain,
		},
	},
});
