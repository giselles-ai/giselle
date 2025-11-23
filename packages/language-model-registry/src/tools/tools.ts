import { anthropicWebSearch } from "./anthropic-web-search";
import { githubApi } from "./github";
import { googleWebSearch } from "./google-web-search";
import { openaiWebSearch } from "./openai-web-search";
import { postgres } from "./postgres";

export const tools = [
	anthropicWebSearch,
	githubApi,
	googleWebSearch,
	openaiWebSearch,
	postgres,
] as const;
