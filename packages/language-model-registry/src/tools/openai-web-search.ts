import { defineLanguageModelTool } from "./tool";

function isValidDomain(domain: string): { isValid: boolean; message?: string } {
	if (!domain.trim()) {
		return { isValid: false, message: "Domain cannot be empty" };
	}
	const domainRegex =
		/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
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
		searchContextSize: {
			name: "searchContextSize",
			type: "enum",
			title: "Search Context Size",
			options: [
				{ value: "low", label: "Low" },
				{ value: "medium", label: "Medium" },
				{ value: "high", label: "High" },
			],
		},
		userLocation: {
			name: "userLocation",
			type: "object",
			title: "User Location",
		},
		filters: {
			name: "filters",
			type: "object",
			title: "Filters",
		},
	},
});
