import { expect, test } from "vitest";
import { Input } from "./save-workflow";

test("Input parse", () => {
	const result = Input.safeParse({
		workflowId: "wf-AMvuYiSoXLnmghVG",
		workflowData: {
			id: "wf-AMvuYiSoXLnmghVG",
			nodes: {
				"nd-C0VtJqQzYtQmlNod": {
					id: "nd-C0VtJqQzYtQmlNod",
					name: "test-node",
					type: "action",
					content: {
						type: "textGeneration",
						llm: "openai:gpt-4o",
						temperature: 0.7,
						topP: 1,
						prompt: "",
						system: "",
						sources: [],
					},
				},
			},
			connections: {},
		},
	});
	expect(result.success).toBe(true);
});
