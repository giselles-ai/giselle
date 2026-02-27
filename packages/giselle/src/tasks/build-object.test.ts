import {
	type CompletedGeneration,
	DataStoreId,
	type EndOutput,
	GenerationId,
	type GenerationOutput,
	NodeId,
	OutputId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { describe, expect, it } from "vitest";
import { buildObject } from "./build-object";

const defaultNodeId = NodeId.generate();
const defaultOutputId = OutputId.generate();

function createCompletedGeneration(params: {
	nodeId?: NodeId;
	outputs: GenerationOutput[];
}): CompletedGeneration {
	const now = Date.now();
	const outputDefinitions = params.outputs.map((output, index) => ({
		id: output.outputId,
		label: `output-${index + 1}`,
		accessor: `output-${index + 1}`,
	}));

	return {
		id: GenerationId.generate(),
		context: {
			operationNode: {
				id: params.nodeId ?? defaultNodeId,
				type: "operation",
				inputs: [],
				outputs: outputDefinitions,
				content: { type: "action" },
			},
			sourceNodes: [],
			connections: [],
			origin: {
				type: "studio",
				workspaceId: WorkspaceId.generate(),
			},
		},
		status: "completed",
		createdAt: now,
		queuedAt: now + 1,
		startedAt: now + 2,
		completedAt: now + 3,
		messages: [],
		outputs: params.outputs,
	};
}

describe("buildObject", () => {
	it("maps a single flat string property", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					summary: { type: "string" },
				},
				additionalProperties: false,
				required: ["summary"],
			},
			mappings: [
				{
					path: ["summary"],
					source: {
						nodeId: defaultNodeId,
						outputId: defaultOutputId,
						path: [],
					},
				},
			],
		};
		const generationsByNodeId = {
			[defaultNodeId]: createCompletedGeneration({
				outputs: [
					{
						type: "generated-text",
						outputId: defaultOutputId,
						content: "hello world",
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({
			summary: "hello world",
		});
	});

	it("maps multiple properties from different generation output types", () => {
		const summaryNodeId = NodeId.generate();
		const queryNodeId = NodeId.generate();
		const dataQueryNodeId = NodeId.generate();
		const summaryOutputId = OutputId.generate();
		const queryOutputId = OutputId.generate();
		const dataQueryOutputId = OutputId.generate();

		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					summary: { type: "string" },
					queryContext: { type: "string" },
					rowsText: { type: "string" },
				},
				additionalProperties: false,
				required: ["summary", "queryContext", "rowsText"],
			},
			mappings: [
				{
					path: ["summary"],
					source: {
						nodeId: summaryNodeId,
						outputId: summaryOutputId,
						path: [],
					},
				},
				{
					path: ["queryContext"],
					source: {
						nodeId: queryNodeId,
						outputId: queryOutputId,
						path: [],
					},
				},
				{
					path: ["rowsText"],
					source: {
						nodeId: dataQueryNodeId,
						outputId: dataQueryOutputId,
						path: [],
					},
				},
			],
		};

		const generationsByNodeId = {
			[summaryNodeId]: createCompletedGeneration({
				nodeId: summaryNodeId,
				outputs: [
					{
						type: "generated-text",
						outputId: summaryOutputId,
						content: "summary text",
					},
				],
			}),
			[queryNodeId]: createCompletedGeneration({
				nodeId: queryNodeId,
				outputs: [
					{
						type: "query-result",
						outputId: queryOutputId,
						content: [],
					},
				],
			}),
			[dataQueryNodeId]: createCompletedGeneration({
				nodeId: dataQueryNodeId,
				outputs: [
					{
						type: "data-query-result",
						outputId: dataQueryOutputId,
						content: {
							type: "data-query",
							dataStoreId: DataStoreId.generate(),
							rows: [{ id: 1, name: "Alice" }],
							rowCount: 1,
							query: "SELECT id, name FROM users",
						},
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({
			summary: "summary text",
			queryContext: "",
			rowsText: JSON.stringify([{ id: 1, name: "Alice" }], null, 2),
		});
	});

	it("maps nested object properties using source.path", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					user: {
						type: "object",
						properties: {
							name: { type: "string" },
						},
						required: ["name"],
						additionalProperties: false,
					},
				},
				additionalProperties: false,
				required: ["user"],
			},
			mappings: [
				{
					path: ["user", "name"],
					source: {
						nodeId: defaultNodeId,
						outputId: defaultOutputId,
						path: ["name"],
					},
				},
			],
		};
		const generationsByNodeId = {
			[defaultNodeId]: createCompletedGeneration({
				outputs: [
					{
						type: "generated-text",
						outputId: defaultOutputId,
						content: JSON.stringify({ name: "Alice" }),
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({
			user: {
				name: "Alice",
			},
		});
	});

	it("maps array values from mapping path ending with items", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					tags: {
						type: "array",
						items: { type: "string" },
					},
				},
				additionalProperties: false,
				required: ["tags"],
			},
			mappings: [
				{
					path: ["tags", "items"],
					source: {
						nodeId: defaultNodeId,
						outputId: defaultOutputId,
						path: ["tags"],
					},
				},
			],
		};
		const generationsByNodeId = {
			[defaultNodeId]: createCompletedGeneration({
				outputs: [
					{
						type: "generated-text",
						outputId: defaultOutputId,
						content: JSON.stringify({ tags: ["a", "b"] }),
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({
			tags: ["a", "b"],
		});
	});

	it("maps array directly when mapping path matches array schema path", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					tags: {
						type: "array",
						items: { type: "string" },
					},
				},
				additionalProperties: false,
				required: ["tags"],
			},
			mappings: [
				{
					path: ["tags"],
					source: {
						nodeId: defaultNodeId,
						outputId: defaultOutputId,
						path: [],
					},
				},
			],
		};
		const generationsByNodeId = {
			[defaultNodeId]: createCompletedGeneration({
				outputs: [
					{
						type: "generated-text",
						outputId: defaultOutputId,
						content: JSON.stringify(["a", "b", "c"]),
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({
			tags: ["a", "b", "c"],
		});
	});

	it("parses whole object when source.path is empty and target schema is object", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					response: {
						type: "object",
						properties: {
							name: { type: "string" },
						},
						required: ["name"],
						additionalProperties: false,
					},
				},
				additionalProperties: false,
				required: ["response"],
			},
			mappings: [
				{
					path: ["response"],
					source: {
						nodeId: defaultNodeId,
						outputId: defaultOutputId,
						path: [],
					},
				},
			],
		};
		const generationsByNodeId = {
			[defaultNodeId]: createCompletedGeneration({
				outputs: [
					{
						type: "generated-text",
						outputId: defaultOutputId,
						content: JSON.stringify({ name: "Bob" }),
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({
			response: {
				name: "Bob",
			},
		});
	});

	it("coerces number and boolean values from raw text", () => {
		const numberNodeId = NodeId.generate();
		const booleanNodeId = NodeId.generate();
		const numberOutputId = OutputId.generate();
		const booleanOutputId = OutputId.generate();

		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					count: { type: "number" },
					isActive: { type: "boolean" },
				},
				additionalProperties: false,
				required: ["count", "isActive"],
			},
			mappings: [
				{
					path: ["count"],
					source: {
						nodeId: numberNodeId,
						outputId: numberOutputId,
						path: [],
					},
				},
				{
					path: ["isActive"],
					source: {
						nodeId: booleanNodeId,
						outputId: booleanOutputId,
						path: [],
					},
				},
			],
		};
		const generationsByNodeId = {
			[numberNodeId]: createCompletedGeneration({
				nodeId: numberNodeId,
				outputs: [
					{
						type: "generated-text",
						outputId: numberOutputId,
						content: "42",
					},
				],
			}),
			[booleanNodeId]: createCompletedGeneration({
				nodeId: booleanNodeId,
				outputs: [
					{
						type: "generated-text",
						outputId: booleanOutputId,
						content: "true",
					},
				],
			}),
		};

		const result = buildObject(endNodeOutput, generationsByNodeId);
		expect(result).toEqual({ count: 42, isActive: true });
		expect(typeof result.count).toBe("number");
		expect(typeof result.isActive).toBe("boolean");
	});

	it("returns empty object when generation is missing for mapped nodeId", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					summary: { type: "string" },
				},
				additionalProperties: false,
				required: ["summary"],
			},
			mappings: [
				{
					path: ["summary"],
					source: {
						nodeId: defaultNodeId,
						outputId: defaultOutputId,
						path: [],
					},
				},
			],
		};

		expect(buildObject(endNodeOutput, {})).toEqual({});
	});

	it("returns empty object when mapped outputId does not exist", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					summary: { type: "string" },
				},
				additionalProperties: false,
				required: ["summary"],
			},
			mappings: [
				{
					path: ["summary"],
					source: {
						nodeId: defaultNodeId,
						outputId: OutputId.generate(),
						path: [],
					},
				},
			],
		};
		const generationsByNodeId = {
			[defaultNodeId]: createCompletedGeneration({
				outputs: [
					{
						type: "generated-text",
						outputId: OutputId.generate(),
						content: "hello",
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({});
	});

	it("returns empty object when source.path points to a missing property", () => {
		const endNodeOutput: Extract<EndOutput, { format: "object" }> = {
			format: "object",
			schema: {
				title: "TestSchema",
				type: "object",
				properties: {
					summary: { type: "string" },
				},
				additionalProperties: false,
				required: ["summary"],
			},
			mappings: [
				{
					path: ["summary"],
					source: {
						nodeId: defaultNodeId,
						outputId: defaultOutputId,
						path: ["missing"],
					},
				},
			],
		};
		const generationsByNodeId = {
			[defaultNodeId]: createCompletedGeneration({
				outputs: [
					{
						type: "generated-text",
						outputId: defaultOutputId,
						content: JSON.stringify({ existing: "value" }),
					},
				],
			}),
		};

		expect(buildObject(endNodeOutput, generationsByNodeId)).toEqual({});
	});
});
