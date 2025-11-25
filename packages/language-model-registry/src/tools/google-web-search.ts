import { defineLanguageModelTool } from "./tool";

export const googleWebSearch = defineLanguageModelTool({
	name: "google-web-search",
	title: "Google Web Search",
	provider: "google",
	configurationOptions: {},
});
