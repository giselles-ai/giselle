import { Agent } from "./agent/index.js";
import {
	type AvailableToolName,
	getAllToolNames,
} from "./agent/tool-registry.js";

const isDebug = process.env.DEBUG === "1";

if (!process.env.GITHUB_TOKEN) {
	throw new Error("GITHUB_TOKEN is required");
}

// Parse command line arguments
const [, , prompt, toolsArg] = process.argv;
if (!prompt) {
	console.error("Please provide a prompt as a command line argument");
	process.exit(1);
}

// Get available tools from Agent
const availableTools = getAllToolNames();

// Parse comma-separated tool names if provided
const inputToolNames = toolsArg
	? toolsArg
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean)
	: [];

// Validate tool names if provided and convert to AvailableToolName type
const toolNames: AvailableToolName[] = [];
if (inputToolNames.length > 0) {
	const invalidTools = inputToolNames.filter(
		(tool) => !availableTools.includes(tool as AvailableToolName),
	);
	if (invalidTools.length > 0) {
		console.error(`Invalid tool(s): ${invalidTools.join(", ")}`);
		console.error(`Available tools: ${availableTools.join(", ")}`);
		process.exit(1);
	}
	toolNames.push(...(inputToolNames as AvailableToolName[]));
}

// If no tools specified, show available tools and use all
if (toolNames.length === 0) {
	console.log(`Using all available tools: ${availableTools.join(", ")}`);
	const agent = Agent.fromAllTools(process.env.GITHUB_TOKEN, { isDebug });
	agent.execute(prompt).then((result) => {
		if (result.type === "success") {
			console.log(result.md);
		} else {
			console.error("Execution failed with message:", result);
		}
	});
} else {
	const agent = Agent.builder()
		.withToken(process.env.GITHUB_TOKEN)
		.withTools(toolNames)
		.withOptions({ isDebug });

	agent.execute(prompt).then((result) => {
		if (result.type === "success") {
			console.log(result.md);
		} else {
			console.error("Execution failed with message:", result);
		}
	});
}
