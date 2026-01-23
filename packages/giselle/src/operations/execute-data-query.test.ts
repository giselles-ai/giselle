import {
	NodeId,
	OutputId,
	type RunningGeneration,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { memoryStorageDriver } from "@giselles-ai/storage";
import { describe, expect, it, vi } from "vitest";
import type { AppEntryResolver } from "../generations";
import { resolveQuery } from "./execute-data-query";

describe("resolveQuery", () => {
	// Shared test fixtures
	const storage = memoryStorageDriver();
	const appEntryResolver: AppEntryResolver = vi
		.fn()
		.mockResolvedValue([{ type: "text", text: "" }]);

	/**
	 * Creates a text node definition for testing
	 */
	function createTextNode(text: string) {
		const nodeId = NodeId.generate();
		const outputId = OutputId.generate();
		return {
			nodeId,
			outputId,
			placeholder: `{{${nodeId}:${outputId}}}`,
			node: {
				id: nodeId,
				type: "variable" as const,
				content: { type: "text" as const, text },
				inputs: [],
				outputs: [{ id: outputId, label: "text", accessor: "text" }],
			},
		};
	}

	/**
	 * Creates a RunningGeneration with given query and source nodes
	 */
	function createGeneration(
		query: string,
		sourceNodes: ReturnType<typeof createTextNode>["node"][] = [],
	): RunningGeneration {
		return {
			id: "gnr-test",
			status: "running",
			createdAt: Date.now(),
			queuedAt: Date.now(),
			startedAt: Date.now(),
			messages: [],
			context: {
				origin: {
					type: "studio",
					workspaceId: WorkspaceId.generate(),
					taskId: undefined,
				},
				operationNode: {
					id: NodeId.generate(),
					type: "operation",
					content: { type: "dataQuery", query },
					inputs: [],
					outputs: [],
				},
				sourceNodes,
				connections: [],
			},
		};
	}

	it("should parameterize simple text node placeholder", async () => {
		const textNode = createTextNode("'); DROP TABLE users; --");
		const query = `SELECT * FROM users WHERE id = '${textNode.placeholder}'`;

		const result = await resolveQuery(
			query,
			createGeneration(query, [textNode.node]),
			storage,
			appEntryResolver,
		);

		expect(result.parameterizedQuery).toBe("SELECT * FROM users WHERE id = $1");
		expect(result.displayQuery).toBe(
			"SELECT * FROM users WHERE id = ''); DROP TABLE users; --'",
		);
		expect(result.values).toEqual(["'); DROP TABLE users; --"]);
	});

	it("should reuse same parameter index for duplicate placeholders", async () => {
		const textNode = createTextNode("test@example.com");
		const query = `SELECT * FROM users WHERE name = '${textNode.placeholder}' AND email = '${textNode.placeholder}'`;

		const result = await resolveQuery(
			query,
			createGeneration(query, [textNode.node]),
			storage,
			appEntryResolver,
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE name = $1 AND email = $1",
		);
		expect(result.displayQuery).toBe(
			"SELECT * FROM users WHERE name = 'test@example.com' AND email = 'test@example.com'",
		);
		expect(result.values).toEqual(["test@example.com"]);
	});

	it("should handle multiple different placeholders", async () => {
		const nameNode = createTextNode("John");
		const ageNode = createTextNode("25");
		const query = `SELECT * FROM users WHERE name = '${nameNode.placeholder}' AND age = ${ageNode.placeholder}`;

		const result = await resolveQuery(
			query,
			createGeneration(query, [nameNode.node, ageNode.node]),
			storage,
			appEntryResolver,
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE name = $1 AND age = $2",
		);
		expect(result.displayQuery).toBe(
			"SELECT * FROM users WHERE name = 'John' AND age = 25",
		);
		expect(result.values).toEqual(["John", "25"]);
	});

	it("should handle empty string values", async () => {
		const textNode = createTextNode("");
		const query = `SELECT * FROM users WHERE name = '${textNode.placeholder}'`;

		const result = await resolveQuery(
			query,
			createGeneration(query, [textNode.node]),
			storage,
			appEntryResolver,
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE name = $1",
		);
		expect(result.displayQuery).toBe("SELECT * FROM users WHERE name = ''");
		expect(result.values).toEqual([""]);
	});

	it("should handle unquoted placeholder", async () => {
		const textNode = createTextNode("100");
		const query = `SELECT * FROM users WHERE age = ${textNode.placeholder}`;

		const result = await resolveQuery(
			query,
			createGeneration(query, [textNode.node]),
			storage,
			appEntryResolver,
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE age = $1",
		);
		expect(result.displayQuery).toBe("SELECT * FROM users WHERE age = 100");
		expect(result.values).toEqual(["100"]);
	});

	it("should handle query without placeholders", async () => {
		const query = "SELECT * FROM users";

		const result = await resolveQuery(
			query,
			createGeneration(query),
			storage,
			appEntryResolver,
		);

		expect(result.parameterizedQuery).toBe(query);
		expect(result.displayQuery).toBe(query);
		expect(result.values).toEqual([]);
	});
});
