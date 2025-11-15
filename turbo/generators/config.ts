import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	// create a generator
	plop.setGenerator("SDK Package Generator", {
		description: "create a new SDK package",
		// gather information from the user
		prompts: [
			{
				type: "input",
				name: "name",
				message: "What is your package name?",
			},
		],
		// perform actions based on the prompts
		actions: [
			{
				type: "addMany",
				destination: "./packages/{{name}}",
				templateFiles: "templates/*.hbs",
			},
			{
				type: "add",
				path: "./packages/{{name}}/src/index.ts",
				template: "",
			},
		],
	});
}
