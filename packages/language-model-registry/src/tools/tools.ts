import { anthropicWebSearch } from "./anthropic-web-search";
import { githubApi } from "./github";
import { googleWebSearch } from "./google-web-search";
import { openaiWebSearch } from "./openai-web-search";
import { postgres } from "./postgres";

export const languageModelTools = [
	anthropicWebSearch,
	githubApi,
	googleWebSearch,
	openaiWebSearch,
	postgres,
] as const;

export const languageModelToolNames = languageModelTools.map(
	(tool) => tool.name,
);
export type LanguageModelToolName = (typeof languageModelToolNames)[number];

export function isLanguageModelToolName(
	v: unknown,
): v is LanguageModelToolName {
	return languageModelToolNames.some((toolName) => toolName === v);
}

export function getLanguageModelTool(name: LanguageModelToolName) {
	const tool = languageModelTools.find((tool) => tool.name === name);
	if (tool === undefined) {
		throw new Error(`Unknown tool name: ${name}`);
	}
	return tool;
}
