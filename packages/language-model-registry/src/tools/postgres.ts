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

export const postgres = defineLanguageModelTool({
	name: "postgres",
	title: "PostgreSQL",
	provider: "giselle",
	tools,
	configurationOptions: {
		secretId: {
			name: "secretId",
			type: "text",
			title: "Secret ID",
		},
		useTools: {
			name: "useTools",
			type: "toolSelection",
			title: "Use Tools",
		},
	},
});
