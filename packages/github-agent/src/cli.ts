import { Agent, type ExecutionResult } from "./agent/index.js";
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

// Get available tools
const availableTools = getAllToolNames();

// 型述語関数を定義
function isAvailableToolName(name: string): name is AvailableToolName {
	return availableTools.includes(name as AvailableToolName);
}

const handleResult = (result: ExecutionResult) => {
	if (result.type === "success") {
		console.log(result.md);
	} else {
		console.error("Execution failed with message:", result);
	}
};

let selectedTools: AvailableToolName[] = [];

if (toolsArg) {
	const inputToolNames = toolsArg
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);

	const invalidTools = inputToolNames.filter(
		(tool) => !isAvailableToolName(tool),
	);

	if (invalidTools.length > 0) {
		console.error(`Invalid tool(s): ${invalidTools.join(", ")}`);
		console.error(`Available tools: ${availableTools.join(", ")}`);
		process.exit(1);
	}

	selectedTools = inputToolNames.filter(isAvailableToolName);
	console.log(`Using tools: ${selectedTools.join(", ")}`);
} else {
	console.log(`Using all available tools: ${availableTools.join(", ")}`);
	selectedTools = availableTools;
}

const agent = new Agent(process.env.GITHUB_TOKEN, {
	allowedToolNames: selectedTools,
	isDebug,
});

agent.execute(prompt).then(handleResult);
