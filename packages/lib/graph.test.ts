import { describe, expect, test } from "vitest";
import type {
	Connection,
	Graph,
	Node,
	TextGenerateActionContent,
} from "../types";
import {
	deriveFlows,
	isLatestVersion,
	migrateGraph,
	validateConnection,
} from "./graph";

// graph is the following structure
// ┌────────────────────────┐          ┌───────────────────┐
// │ [File1]                │          │ [Summary]         │
// │ i1042-5055-29-1-1.pdf  │ ───────> │ Key takeaway...   │
// └────────────────────────┘          └───────────────────┘
//
// ┌────────────────────────┐          ┌────────────────────┐          ┌────────────────────┐
// │ [Goodday]              │          │ [Greetings]        │          │ [Translator]       │
// │ Today is very good day │ ───────> │ Hello              │ ───────> │ Translate Japanese │
// └────────────────────────┘          └────────────────────┘          └────────────────────┘
const graph: Graph = {
	id: "grph_ef00f8t2ojt65vl2a769vkmq",
	nodes: [
		{
			id: "nd_i85invgzw0pgxzmjathkwhrr",
			name: "File1",
			position: { x: 137, y: 185 },
			selected: false,
			type: "variable",
			content: {
				type: "file",
				data: {
					id: "fl_j4riw5k1p5jqe3tbugtaj5oc",
					status: "completed",
					name: "i1042-5055-29-1-1.pdf",
					contentType: "application/pdf",
					size: 689064,
					uploadedAt: 1733318593333,
					fileBlobUrl:
						"https://aj9qps90wwygtg5h.public.blob.vercel-storage.com/canary/files/fl_j4riw5k1p5jqe3tbugtaj5oc/i1042-5055-29-1-1-zZizzVpxjulkzHskqUJ068Qu4jQHHv.pdf",
					processedAt: 1733318601585,
					textDataUrl:
						"https://aj9qps90wwygtg5h.public.blob.vercel-storage.com/canary/files/fl_j4riw5k1p5jqe3tbugtaj5oc/markdown-iYTpEtxjznsh86cN8UWqXMxAPhF8SY.md",
				},
			},
		},
		{
			id: "nd_vwczcdxw0f27r7lifmi8jnk3",
			name: "Summary",
			position: { x: 420, y: 180 },
			selected: false,
			type: "action",
			content: {
				type: "textGeneration",
				llm: "anthropic:claude-3-5-sonnet-latest",
				temperature: 0.7,
				topP: 1,
				instruction: "Please let me know key takeaway about ",
				sources: [{ id: "ndh_rfpzu51jfnl1k2ccq31exevk", label: "Source1" }],
			},
		},
		{
			id: "nd_ffz8hv1isj4w3r4s23a6klkz",
			name: "Greetings",
			position: { x: 480, y: 345 },
			selected: false,
			type: "action",
			content: {
				type: "textGeneration",
				llm: "anthropic:claude-3-5-sonnet-latest",
				temperature: 0.7,
				topP: 1,
				instruction: "Hello",
				sources: [{ id: "ndh_n3xuz7ao5dyfusfukagbi3l7", label: "Source1" }],
			},
		},
		{
			id: "nd_h8h4uhp7kov9v7pj1yyofen8",
			name: "Goodday",
			position: { x: 135, y: 360 },
			selected: false,
			type: "action",
			content: {
				type: "textGeneration",
				llm: "anthropic:claude-3-5-sonnet-latest",
				temperature: 0.7,
				topP: 1,
				instruction: "Good day",
				sources: [],
			},
		},
		{
			id: "nd_guzyxfacpt5db2n9lkjify3z",
			name: "Translator",
			position: { x: 802, y: 403 },
			selected: true,
			type: "action",
			content: {
				type: "textGeneration",
				llm: "anthropic:claude-3-5-sonnet-latest",
				temperature: 0.7,
				topP: 1,
				instruction: "Translate in Japanese",
				sources: [{ id: "ndh_xjlzyp1yq7vd1ih43rxuo8l9", label: "Source1" }],
			},
		},
	],
	connections: [
		{
			id: "cnnc_j5gr5slzzb96unyaddc3fik6",
			sourceNodeId: "nd_i85invgzw0pgxzmjathkwhrr",
			sourceNodeType: "variable",
			targetNodeId: "nd_vwczcdxw0f27r7lifmi8jnk3",
			targetNodeType: "action",
			targetNodeHandleId: "ndh_rfpzu51jfnl1k2ccq31exevk",
		},
		{
			id: "cnnc_x8dy20365eqk9h033a800a5a",
			sourceNodeId: "nd_h8h4uhp7kov9v7pj1yyofen8",
			sourceNodeType: "action",
			targetNodeId: "nd_ffz8hv1isj4w3r4s23a6klkz",
			targetNodeType: "action",
			targetNodeHandleId: "ndh_n3xuz7ao5dyfusfukagbi3l7",
		},
		{
			id: "cnnc_lxqmqyb50b0qnuvrxcpavvax",
			sourceNodeId: "nd_ffz8hv1isj4w3r4s23a6klkz",
			sourceNodeType: "action",
			targetNodeId: "nd_guzyxfacpt5db2n9lkjify3z",
			targetNodeHandleId: "ndh_xjlzyp1yq7vd1ih43rxuo8l9",
			targetNodeType: "action",
		},
		// Ghost connection(targetNodeId is not in nodes)
		{
			id: "cnnc_ghost_connection",
			sourceNodeId: "nd_ffz8hv1isj4w3r4s23a6klkz",
			sourceNodeType: "action",
			targetNodeId: "nd_fake_node",
			targetNodeHandleId: "ndh_fake_node_handle",
			targetNodeType: "action",
		},
	],
	artifacts: [],
	version: "2024-12-09",
	flows: [],
	executionIndexes: [],
};

describe("deriveFlows", () => {
	const flows = deriveFlows(graph);
	test("two sub flows", () => {
		expect(flows.length).toBe(2);
	});
	test("one flow has two nodes while the other has three", () => {
		expect(flows[0].nodes.length).toBe(2);
		expect(flows[1].nodes.length).toBe(3);
	});
	test("ignore ghost connectors", () => {
		expect(flows[1].jobs[2].steps.length).toBe(1);
	});
	test("same flowId", () => {
		const newFlows = deriveFlows({ ...graph, flows });
		expect(flows[0].id).toBe(newFlows[0].id);
	});
	test("one node graph", () => {
		const testFlows = deriveFlows({
			nodes: [
				{
					id: "nd_onenode",
					name: "Summary",
					position: { x: 420, y: 180 },
					selected: false,
					type: "action",
					content: {
						type: "textGeneration",
						llm: "anthropic:claude-3-5-sonnet-latest",
						temperature: 0.7,
						topP: 1,
						instruction: "Please let me know key takeaway about ",
						sources: [],
					},
				},
			],
			connections: [],
			flows: [],
		});
		expect(testFlows.length).toBe(1);
		expect(testFlows[0].jobs[0].steps[0].nodeId).toBe("nd_onenode");
	});
});

describe("isLatestVersion", () => {
	test("latest version", () => {
		expect(isLatestVersion({ version: "20241217" } as Graph)).toBe(true);
	});
	test("old version", () => {
		expect(isLatestVersion({} as Graph)).toBe(false);
	});
});

describe("migrateGraph", () => {
	test("migrate to 2024-12-09", () => {
		const after = migrateGraph({
			connections: [],
			nodes: [],
			artifacts: [],
		} as unknown as Graph);
		expect(after).toHaveProperty("version");
	});
	test("migrate to 2024-12-10", () => {
		const after = migrateGraph({
			connections: [],
			nodes: [
				{
					id: "nd_i85invgzw0pgxzmjathkwhrr",
					name: "File1",
					position: { x: 137, y: 185 },
					selected: false,
					type: "variable",
					content: {
						type: "file",
						data: {
							id: "fl_j4riw5k1p5jqe3tbugtaj5oc",
							status: "completed",
							name: "i1042-5055-29-1-1.pdf",
							contentType: "application/pdf",
							size: 689064,
							uploadedAt: 1733318593333,
							fileBlobUrl:
								"https://aj9qps90wwygtg5h.public.blob.vercel-storage.com/canary/files/fl_j4riw5k1p5jqe3tbugtaj5oc/i1042-5055-29-1-1-zZizzVpxjulkzHskqUJ068Qu4jQHHv.pdf",
							processedAt: 1733318601585,
							textDataUrl:
								"https://aj9qps90wwygtg5h.public.blob.vercel-storage.com/canary/files/fl_j4riw5k1p5jqe3tbugtaj5oc/markdown-iYTpEtxjznsh86cN8UWqXMxAPhF8SY.md",
						},
					},
				},
			],
			artifacts: [],
			flows: [],
		} as unknown as Graph);
		expect(after.version).toBe("20241217");
		expect(after.nodes[0].content.type).toBe("files");
	});
});

describe("validateConnection", () => {
	const baseNode = {
		name: "Test Node",
		position: { x: 0, y: 0 },
		selected: false,
		content: {
			type: "textGeneration" as const,
			llm: "anthropic:claude-3-5-sonnet-latest",
			temperature: 0.7,
			topP: 1,
			instruction: "test",
			sources: [],
		} as TextGenerateActionContent,
	};

	test("prevents self-reference connections", () => {
		const nodes: Node[] = [
			{
				...baseNode,
				id: "nd_node1",
				type: "action",
			},
		];

		const selfConnection: Connection = {
			id: "cnnc_conn1",
			sourceNodeId: "nd_node1",
			targetNodeId: "nd_node1",
			sourceNodeType: "action",
			targetNodeType: "action",
			targetNodeHandleId: "ndh_handle1",
		};

		const result = validateConnection(selfConnection, [], nodes);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Self-reference connections are not allowed");
	});

	test("prevents connections to non-existent nodes", () => {
		const nodes: Node[] = [
			{
				...baseNode,
				id: "nd_node1",
				type: "action",
			},
		];

		const invalidConnection: Connection = {
			id: "cnnc_conn1",
			sourceNodeId: "nd_node1",
			targetNodeId: "nd_nonexistent",
			sourceNodeType: "action",
			targetNodeType: "action",
			targetNodeHandleId: "ndh_handle1",
		};

		const result = validateConnection(invalidConnection, [], nodes);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Target node nd_nonexistent does not exist");
	});

	test("prevents connections with mismatched source node type", () => {
		const nodes: Node[] = [
			{
				...baseNode,
				id: "nd_node1",
				type: "action",
			},
			{
				...baseNode,
				id: "nd_node2",
				type: "action",
			},
		];

		const invalidConnection: Connection = {
			id: "cnnc_conn1",
			sourceNodeId: "nd_node1",
			targetNodeId: "nd_node2",
			sourceNodeType: "variable",
			targetNodeType: "action",
			targetNodeHandleId: "ndh_handle1",
		};

		const result = validateConnection(invalidConnection, [], nodes);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe(
			"Source node type mismatch: expected action, got variable",
		);
	});

	test("prevents circular dependencies", () => {
		const nodes: Node[] = [
			{
				...baseNode,
				id: "nd_node1",
				type: "action",
			},
			{
				...baseNode,
				id: "nd_node2",
				type: "action",
			},
			{
				...baseNode,
				id: "nd_node3",
				type: "action",
			},
		];

		const existingConnections: Connection[] = [
			{
				id: "cnnc_conn1",
				sourceNodeId: "nd_node1",
				targetNodeId: "nd_node2",
				sourceNodeType: "action",
				targetNodeType: "action",
				targetNodeHandleId: "ndh_handle1",
			},
			{
				id: "cnnc_conn2",
				sourceNodeId: "nd_node2",
				targetNodeId: "nd_node3",
				sourceNodeType: "action",
				targetNodeType: "action",
				targetNodeHandleId: "ndh_handle2",
			},
		];

		const circularConnection: Connection = {
			id: "cnnc_conn3",
			sourceNodeId: "nd_node3",
			targetNodeId: "nd_node1",
			sourceNodeType: "action",
			targetNodeType: "action",
			targetNodeHandleId: "ndh_handle3",
		};

		const result = validateConnection(
			circularConnection,
			existingConnections,
			nodes,
		);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe(
			"Adding this connection would create a circular dependency",
		);
	});

	test("allows valid connections", () => {
		const nodes: Node[] = [
			{
				...baseNode,
				id: "nd_node1",
				type: "action",
			},
			{
				...baseNode,
				id: "nd_node2",
				type: "action",
			},
			{
				...baseNode,
				id: "nd_node3",
				type: "action",
			},
		];

		const existingConnections: Connection[] = [
			{
				id: "cnnc_conn1",
				sourceNodeId: "nd_node1",
				targetNodeId: "nd_node2",
				sourceNodeType: "action",
				targetNodeType: "action",
				targetNodeHandleId: "ndh_handle1",
			},
		];

		const validConnection: Connection = {
			id: "cnnc_conn2",
			sourceNodeId: "nd_node2",
			targetNodeId: "nd_node3",
			sourceNodeType: "action",
			targetNodeType: "action",
			targetNodeHandleId: "ndh_handle2",
		};

		const result = validateConnection(
			validConnection,
			existingConnections,
			nodes,
		);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});
});
