import type {
	Connection,
	ConnectionId,
	Node,
	NodeId,
	WorkflowId,
} from "@giselle-sdk/data-type";
import { describe, expect, test } from "vitest";
import { buildWorkflowMap } from "./build-workflow";

// Sample data for tests based on provided workflow JSON
const sampleNodes: Node[] = [
	{
		id: "nd-KzXeXSIffRIMwZtX",
		type: "action",
		inputs: [],
		outputs: [
			{
				id: "otp-93MKjM7HdSu3hOdw",
				label: "Output",
				accessor: "generated-text",
			},
		],
		content: {
			type: "textGeneration",
			llm: {
				provider: "openai",
				id: "gpt-4o-mini",
				configurations: {
					temperature: 0.7,
					topP: 1,
					presencePenalty: 0,
					frequencyPenalty: 0,
				},
			},
			prompt:
				'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}',
		},
	},
	{
		id: "nd-P2EllMigi6Tm6gij",
		type: "action",
		inputs: [{ id: "inp-id3Grof8Hyy3DJbN", label: "Input" }],
		outputs: [
			{
				id: "otp-Fdzlled7cDxSIa7G",
				label: "Output",
				accessor: "generated-text",
			},
		],
		content: {
			type: "textGeneration",
			llm: {
				provider: "openai",
				id: "gpt-4o-mini",
				configurations: {
					temperature: 0.7,
					topP: 1,
					presencePenalty: 0,
					frequencyPenalty: 0,
				},
			},
		},
	},
] as Node[];

const sampleConnections: Connection[] = [
	{
		id: "cnnc-7SZdtE1iSWtoghGD",
		outputNode: {
			id: "nd-KzXeXSIffRIMwZtX",
			type: "action",
			content: { type: "textGeneration" },
		},
		outputId: "otp-93MKjM7HdSu3hOdw",
		inputNode: {
			id: "nd-P2EllMigi6Tm6gij",
			type: "action",
			content: { type: "textGeneration" },
		},
		inputId: "inp-id3Grof8Hyy3DJbN",
	},
] as Connection[];

// Setup helper variables
const nodeMap = new Map<NodeId, Node>(
	sampleNodes.map((node) => [node.id, node]),
);
const connectionMap = new Map<ConnectionId, Connection>(
	sampleConnections.map((connection) => [connection.id, connection]),
);

describe("buildWorkflowMap", () => {
	test("should create a workflow map from sample nodes and connections", () => {
		const result = buildWorkflowMap(nodeMap, connectionMap);

		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(1); // One workflow in our sample

		// Get the workflow from the map
		const workflow = Array.from(result.values())[0];

		// Check workflow structure
		expect(workflow.nodes.length).toBe(2); // Two nodes in our workflow
		expect(workflow.jobs.length).toBe(2); // Two jobs because of the dependency structure

		// Check if nodes are included in the workflow
		const nodeIds = workflow.nodes.map((node) => node.id);
		expect(nodeIds).toContain("nd-KzXeXSIffRIMwZtX");
		expect(nodeIds).toContain("nd-P2EllMigi6Tm6gij");

		// Check job structure
		const jobsWithFirstNode = workflow.jobs.filter((job) =>
			job.actions.some((action) => action.node.id === "nd-KzXeXSIffRIMwZtX"),
		);
		const jobsWithSecondNode = workflow.jobs.filter((job) =>
			job.actions.some((action) => action.node.id === "nd-P2EllMigi6Tm6gij"),
		);

		expect(jobsWithFirstNode.length).toBe(1);
		expect(jobsWithSecondNode.length).toBe(1);

		// Check dependency relationship in generation templates
		const secondNodeJob = jobsWithSecondNode[0];
		expect(secondNodeJob.actions[0].generationTemplate.sourceNodes.length).toBe(
			1,
		);
		expect(secondNodeJob.actions[0].generationTemplate.sourceNodes[0].id).toBe(
			"nd-KzXeXSIffRIMwZtX",
		);
	});

	test("should handle empty maps", () => {
		const emptyNodeMap = new Map<NodeId, Node>();
		const emptyConnectionMap = new Map<ConnectionId, Connection>();

		const result = buildWorkflowMap(emptyNodeMap, emptyConnectionMap);

		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(0);
	});

	test("should handle maps with only non-action nodes", () => {
		const nonActionNode: Node = {
			id: "nd-NonAction",
			type: "data",
			inputs: [],
			outputs: [],
			content: { type: "data" },
		} as unknown as Node;

		const nonActionNodeMap = new Map<NodeId, Node>([
			["nd-NonAction", nonActionNode],
		]);

		const result = buildWorkflowMap(nonActionNodeMap, connectionMap);

		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(0);
	});

	test("should handle complex workflows with multiple connections", () => {
		// Sample data from complex workflow example
		const complexNodes: Node[] = [
			{
				id: "nd-E89xeYnFyQUGxdCL",
				type: "action",
				inputs: [],
				outputs: [
					{
						id: "otp-iK3fTc8uBJn2JFM8",
						label: "Output",
						accessor: "generated-text",
					},
					{
						id: "otp-178F8dUeKWPWlU6y",
						label: "Source",
						accessor: "source",
					},
				],
				content: {
					type: "textGeneration",
					llm: {
						provider: "perplexity",
						id: "sonar-pro",
						configurations: {
							temperature: 0.2,
							topP: 0.9,
							presencePenalty: 0,
							frequencyPenalty: 1,
						},
					},
				},
			},
			{
				id: "nd-daF6m8YshVoiBARi",
				name: "gemini-2.0-flash-0012",
				type: "action",
				inputs: [
					{ id: "inp-rVg0GxYPFNnFUvJd", label: "Input" },
					{ id: "inp-xYV0iiqdumwxPOQR", label: "Input" },
				],
				outputs: [
					{
						id: "otp-B7rFjf3M6m14gN7R",
						label: "Output",
						accessor: "generated-text",
					},
				],
				content: {
					type: "textGeneration",
					llm: {
						provider: "google",
						id: "gemini-2.0-flash-001",
						configurations: {
							temperature: 0.7,
							topP: 1,
							searchGrounding: false,
						},
					},
				},
			},
			{
				id: "nd-ixIefYTHjZVhpEGq",
				type: "action",
				inputs: [{ id: "inp-vZaOw0D8k9uyGNgp", label: "Input" }],
				outputs: [
					{
						id: "otp-yXSelwQUWs6DQrFl",
						label: "Output",
						accessor: "generated-text",
					},
				],
				content: {
					type: "textGeneration",
					llm: {
						provider: "google",
						id: "gemini-2.0-flash-001",
						configurations: {
							temperature: 0.7,
							topP: 1,
							searchGrounding: false,
						},
					},
				},
			},
		] as Node[];

		const complexConnections: Connection[] = [
			{
				id: "cnnc-KprKOaAqxL7TXeHZ",
				outputNode: {
					id: "nd-E89xeYnFyQUGxdCL",
					type: "action",
					content: { type: "textGeneration" },
				},
				outputId: "otp-iK3fTc8uBJn2JFM8",
				inputNode: {
					id: "nd-daF6m8YshVoiBARi",
					type: "action",
					content: { type: "textGeneration" },
				},
				inputId: "inp-rVg0GxYPFNnFUvJd",
			},
			{
				id: "cnnc-VWcUOOacadZQ2CMc",
				outputNode: {
					id: "nd-E89xeYnFyQUGxdCL",
					type: "action",
					content: { type: "textGeneration" },
				},
				outputId: "otp-178F8dUeKWPWlU6y",
				inputNode: {
					id: "nd-daF6m8YshVoiBARi",
					type: "action",
					content: { type: "textGeneration" },
				},
				inputId: "inp-xYV0iiqdumwxPOQR",
			},
			{
				id: "cnnc-pHNejzic6NKKxBsA",
				outputNode: {
					id: "nd-E89xeYnFyQUGxdCL",
					type: "action",
					content: { type: "textGeneration" },
				},
				outputId: "otp-iK3fTc8uBJn2JFM8",
				inputNode: {
					id: "nd-ixIefYTHjZVhpEGq",
					type: "action",
					content: { type: "textGeneration" },
				},
				inputId: "inp-vZaOw0D8k9uyGNgp",
			},
		] as Connection[];

		// Setup maps
		const complexNodeMap = new Map<NodeId, Node>(
			complexNodes.map((node) => [node.id, node]),
		);
		const complexConnectionMap = new Map<ConnectionId, Connection>(
			complexConnections.map((connection) => [connection.id, connection]),
		);

		const result = buildWorkflowMap(complexNodeMap, complexConnectionMap);

		const workflow = Array.from(result.values())[0];

		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(1); // One workflow containing all the nodes

		// Check workflow structure
		expect(workflow.nodes.length).toBe(3); // Three nodes in our workflow
		expect(workflow.jobs.length).toBe(2); // Two jobs

		// Check if nodes are included in the workflow
		const nodeIds = workflow.nodes.map((node) => node.id).sort();
		expect(nodeIds).toEqual(
			[
				"nd-E89xeYnFyQUGxdCL",
				"nd-daF6m8YshVoiBARi",
				"nd-ixIefYTHjZVhpEGq",
			].sort(),
		);

		// The first job should be the source node
		expect(workflow.jobs[0].actions.length).toBe(1);
		expect(workflow.jobs[0].actions[0].node.id).toBe("nd-E89xeYnFyQUGxdCL");

		// The second job should contain both dependent nodes
		expect(workflow.jobs[1].actions.length).toBe(2);

		// Get both nodes IDs from the second job
		const secondJobNodeIds = workflow.jobs[1].actions
			.map((action) => action.node.id)
			.sort();

		expect(secondJobNodeIds).toEqual(
			["nd-daF6m8YshVoiBARi", "nd-ixIefYTHjZVhpEGq"].sort(),
		);

		// Check generation templates for source and dependent nodes
		for (const job of workflow.jobs) {
			for (const action of job.actions) {
				const nodeId = action.node.id;

				if (nodeId === "nd-E89xeYnFyQUGxdCL") {
					// Source node has no dependencies
					expect(action.generationTemplate.sourceNodes.length).toBe(0);
				} else if (nodeId === "nd-daF6m8YshVoiBARi") {
					// This node has two inputs connected to the source node
					expect(action.generationTemplate.sourceNodes.length).toBe(2);
					expect(action.generationTemplate.sourceNodes[0].id).toBe(
						"nd-E89xeYnFyQUGxdCL",
					);
					expect(action.generationTemplate.sourceNodes[1].id).toBe(
						"nd-E89xeYnFyQUGxdCL",
					);
				} else if (nodeId === "nd-ixIefYTHjZVhpEGq") {
					// This node has one input connected to the source node
					expect(action.generationTemplate.sourceNodes.length).toBe(1);
					expect(action.generationTemplate.sourceNodes[0].id).toBe(
						"nd-E89xeYnFyQUGxdCL",
					);
				}
			}
		}
	});
});
