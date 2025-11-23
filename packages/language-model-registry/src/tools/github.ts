import * as z from "zod/v4";
import { defineLanguageModelTool, defineTool } from "./tool";

const tools = [
	defineTool({
		name: "createIssue",
		title: "Create Issue",
		description: "Create a new issue on a GitHub repository",
	}),
	defineTool({
		name: "createPullRequest",
		title: "Create Pull Request",
		description: "Create a new pull request on a GitHub repository",
	}),
];

type ToolName = (typeof tools)[number]["name"];
function isToolName(arg: unknown): arg is ToolName {
	return tools.some((tool) => tool.name === arg);
}
const ToolName = z.custom<ToolName>((v) => isToolName(v));

export const githubApi = defineLanguageModelTool({
	name: "github-api",
	title: "GitHub",
	provider: "giselle",
	tools: [
		defineTool({
			name: "createIssue",
			title: "Create Issue",
			description: "Create a new issue on a GitHub repository",
		}),
	],
	configurationOptions: {
		token: {
			name: "token",
			schema: z.string(),
		},
		useTools: {
			name: "useTools",
			schema: z.array(ToolName),
		},
	},
});
