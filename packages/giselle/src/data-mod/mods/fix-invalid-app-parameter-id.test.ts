import { nodeFactories } from "@giselles-ai/node-registry";
import { isAppEntryNode, Node } from "@giselles-ai/protocol";
import type { $ZodIssue } from "@zod/core";
import { expect, test } from "vitest";
import { parseAndMod } from "../index";
import { fixInvalidAppParameterId } from "./fix-invalid-app-parameter-id";

test("fixInvalidAppParameterId: repairs invalid draftApp.parameters[*].id", () => {
	const data = {
		content: {
			draftApp: {
				parameters: [{ id: "appprm-invalid", name: "x" }],
			},
		},
	};
	const issue = {
		code: "invalid_format",
		format: "regex",
		path: ["content", "draftApp", "parameters", 0, "id"],
	} as unknown as $ZodIssue;

	const nextData = fixInvalidAppParameterId(data, issue) as typeof data;
	expect(nextData).not.toBe(data);
	expect(nextData.content.draftApp.parameters[0]?.id).toMatch(
		/^appprm-[0-9A-Za-z]{16}$/,
	);
});

test("parseAndMod(Node): does not throw for invalid draftApp parameter ids", () => {
	const node = nodeFactories.create("appEntry");
	if (!isAppEntryNode(node)) {
		throw new Error("Expected appEntry node");
	}
	if (node.content.status !== "unconfigured") {
		throw new Error("Expected unconfigured appEntry node");
	}
	// Make it invalid on purpose
	const first = node.content.draftApp.parameters[0];
	if (!first) {
		throw new Error(
			"Expected appEntry to have at least one draftApp parameter",
		);
	}
	first.id = "appprm-bad";

	const parsed = parseAndMod(Node, node);
	expect(parsed.content.type).toBe("appEntry");
	if (!isAppEntryNode(parsed)) {
		throw new Error("Expected parsed appEntry node");
	}
	if (parsed.content.status !== "unconfigured") {
		throw new Error("Expected parsed unconfigured appEntry node");
	}
	expect(parsed.content.draftApp.parameters[0]?.id).toMatch(
		/^appprm-[0-9A-Za-z]{16}$/,
	);
});
