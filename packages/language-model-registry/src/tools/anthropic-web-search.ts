import { defineLanguageModelTool } from "./tool";

function isValidDomain(domain: string): { isValid: boolean; message?: string } {
	if (!domain.trim()) {
		return { isValid: false, message: "Domain cannot be empty" };
	}
	// Basic domain validation
	const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
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
			type: "enum",
			valueType: "number",
			title: "Maximum Uses",
			description: "Limits the number of searches performed",
			options: [
				{ value: "1", label: "1" },
				{ value: "2", label: "2" },
				{ value: "3", label: "3" },
				{ value: "4", label: "4" },
				{ value: "5", label: "5" },
			],
			optional: true,
		},
		allowedDomains: {
			name: "allowedDomains",
			type: "tagArray",
			title: "Allowed Domains",
			description:
				"You can use either allowed_domains or blocked_domains, but not both",
			placeholder: "Domain Names (separate with commas)",
			validate: isValidDomain,
			optional: true,
		},
		blockedDomains: {
			name: "blockedDomains",
			type: "tagArray",
			title: "Blocked Domains",
			description:
				"You can use either allowed_domains or blocked_domains, but not both",
			placeholder: "Domain Names (separate with commas)",
			validate: isValidDomain,
			optional: true,
		},
	},
});
