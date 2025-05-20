import {
	CompletedGeneration,
	Generation,
	Workspace,
} from "@giselle-sdk/data-type";
import { describe, expect, test } from "vitest";
import { dataMod, parseAndMod } from ".";
import workspaceJson from "./fixtures/workspace1.json";
import { getValueAtPath } from "./utils";

test("parseAndMod#1", () => {
	const parseResult = Workspace.safeParse(workspaceJson);
	expect(parseResult.success).toBeFalsy();

	const mod = parseAndMod(Workspace, workspaceJson);
	const modParseResult = Workspace.safeParse(mod);
	expect(modParseResult.success).toBeTruthy();
});

test("parseAndMod adds usage field to CompletedGeneration", () => {
	// Create a completed generation object without a usage field
	// CompletedGeneration schema requires usage field, so this should fail validation
	const generation = {
		id: "gnr-1234567890ABCDEF",
		context: {
			origin: { type: "workspace", id: "wrks-1234567890ABCDEF" },
			operationNode: {
				id: "nd-1234567890ABCDEF",
				type: "operation",
				inputs: [],
				outputs: [],
				content: {
					type: "textGeneration",
					llm: {
						provider: "openai",
						id: "gpt-4o",
						configurations: {
							temperature: 0.7,
						},
					},
					prompt: "Hello",
				},
			},
			sourceNodes: [],
		},
		status: "completed",
		createdAt: 1643000000000,
		queuedAt: 1643000001000,
		startedAt: 1643000002000,
		completedAt: 1643000003000,
		messages: [
			{ role: "user", content: "Hello" },
			{ role: "assistant", content: "Hi there!" },
		],
		outputs: [
			{
				type: "generated-text",
				outputId: "otp-1234567890ABCDEF",
				content: "Hi there!",
				contents: ["Hi there!"],
			},
		],
	};

	// CompletedGeneration schema requires usage field, so validation should fail
	const parseResult = CompletedGeneration.safeParse(generation);
	expect(parseResult.success).toBeFalsy();

	// Apply the data mod
	const mod = parseAndMod(CompletedGeneration, generation);

	// Validation should now pass
	const modParseResult = CompletedGeneration.safeParse(mod);
	expect(modParseResult.success).toBeTruthy();

	// Check if usage field was added with expected values
	if (modParseResult.success) {
		expect(modParseResult.data.usage).toBeDefined();
		expect(modParseResult.data.usage.promptTokens).toBeGreaterThan(0);
		expect(modParseResult.data.usage.completionTokens).toBeGreaterThan(0);
		expect(modParseResult.data.usage.totalTokens).toBeGreaterThan(0);
	}
});
