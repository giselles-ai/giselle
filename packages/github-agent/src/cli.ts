import { Agent } from "./agent/index.js";

const isDebug = process.env.DEBUG === "1";

if (!process.env.GITHUB_TOKEN) {
	throw new Error("GITHUB_TOKEN is required");
}

const agent = new Agent(process.env.GITHUB_TOKEN, {
	isDebug,
});

// Get prompt from command line arguments
const prompt = process.argv[2];
if (!prompt) {
	console.error("Please provide a prompt as a command line argument");
	process.exit(1);
}

agent.execute(prompt).then((result) => {
	if (result.type === "success") {
		console.log(result.md);
	} else {
		console.error("Execution failed with message:", result);
	}
});
