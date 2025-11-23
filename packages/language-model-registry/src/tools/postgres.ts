import * as z from "zod/v4";
import { defineLanguageModelTool, defineTool } from "./tool";

const tools = [
	defineTool({
		name: "getTableStructure",
		title: "Get Table Structure",
		description:
			"Returns database table structure sorted by table and position.",
	}),
	defineTool({
		name: "query",
		title: "Query",
		description: "Run a SQL query",
	}),
] as const;

type ToolName = (typeof tools)[number]["name"];
function isToolName(arg: unknown): arg is ToolName {
	return tools.some((tool) => tool.name === arg);
}
const ToolName = z.custom<ToolName>((v) => isToolName(v));

export const postgres = defineLanguageModelTool({
	name: "postgres",
	title: "PostgreSQL",
	provider: "giselle",
	tools,
	configurationOptions: {
		secretId: {
			name: "secretId",
			schema: z.string(),
		},
		useTools: {
			name: "useTools",
			schema: z.array(ToolName),
		},
	},
});
