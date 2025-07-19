import type { Connection, Node, WorkflowId } from "@giselle-sdk/data-type";
import { describe, expect, test } from "vitest";
import { buildSequenceList } from "./helper";

// Sample data for tests based on provided workflow JSON
const sampleNodes: Node[] = [
	{
		id: "nd-KzXeXSIffRIMwZtX",
		type: "operation",
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
				id: "gpt-4.1-mini",
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
		type: "operation",
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
			type: "operation",
			content: { type: "textGeneration" },
		},
		outputId: "otp-93MKjM7HdSu3hOdw",
		inputNode: {
			id: "nd-P2EllMigi6Tm6gij",
			type: "operation",
			content: { type: "textGeneration" },
		},
		inputId: "inp-id3Grof8Hyy3DJbN",
	},
] as Connection[];

const workflowId = "wf-N5RH1s46zdx3XjQj" as WorkflowId;

describe("buildSequenceList", () => {
	test("should create sequences for the sample workflow", () => {
		const result = buildSequenceList(
			sampleNodes,
			sampleConnections,
			workflowId,
		);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(2); // Two sequences because of the dependency structure

		const sequencesArray = result;

		// First sequence should contain the first node (which has no inputs)
		expect(sequencesArray[0].workflowId).toBe(workflowId);
		expect(sequencesArray[0].steps.length).toBe(1);
		expect(sequencesArray[0].steps[0].node.id).toBe("nd-KzXeXSIffRIMwZtX");

		// Second sequence should contain the second node (which depends on the first)
		expect(sequencesArray[1].workflowId).toBe(workflowId);
		expect(sequencesArray[1].steps.length).toBe(1);
		expect(sequencesArray[1].steps[0].node.id).toBe("nd-P2EllMigi6Tm6gij");

		// Check generation templates
		expect(sequencesArray[0].steps[0].sourceNodes.length).toBe(0);
		expect(sequencesArray[1].steps[0].sourceNodes.length).toBe(1);
		expect(sequencesArray[1].steps[0].sourceNodes[0].id).toBe(
			"nd-KzXeXSIffRIMwZtX",
		);
	});

	test("should handle empty node set", () => {
		const result = buildSequenceList([], [], workflowId);

		expect(result.length).toBe(0);
	});
});

describe("Test with complex workflow", () => {
	// Sample data from user's example
	const complexNodes: Node[] = [
		{
			id: "nd-E89xeYnFyQUGxdCL",
			type: "operation",
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
			type: "operation",
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
			type: "operation",
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
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-iK3fTc8uBJn2JFM8",
			inputNode: {
				id: "nd-daF6m8YshVoiBARi",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-rVg0GxYPFNnFUvJd",
		},
		{
			id: "cnnc-VWcUOOacadZQ2CMc",
			outputNode: {
				id: "nd-E89xeYnFyQUGxdCL",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-178F8dUeKWPWlU6y",
			inputNode: {
				id: "nd-daF6m8YshVoiBARi",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-xYV0iiqdumwxPOQR",
		},
		{
			id: "cnnc-pHNejzic6NKKxBsA",
			outputNode: {
				id: "nd-E89xeYnFyQUGxdCL",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-iK3fTc8uBJn2JFM8",
			inputNode: {
				id: "nd-ixIefYTHjZVhpEGq",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-vZaOw0D8k9uyGNgp",
		},
	] as Connection[];

	// Setup helper variables
	const complexWorkflowId = "wf-fgEzJutLbpYu1Hj3" as WorkflowId;

	test("should create correct sequence map for complex workflow", () => {
		const result = buildSequenceList(
			complexNodes,
			complexConnections,
			complexWorkflowId,
		);

		const sequencesArray = result;

		expect(result.length).toBe(2); // Two sequences: one for source node and one for dependent nodes

		// First sequence should contain the first node (which has no inputs)
		expect(sequencesArray[0].workflowId).toBe(complexWorkflowId);
		expect(sequencesArray[0].steps.length).toBe(1);
		expect(sequencesArray[0].steps[0].node.id).toBe("nd-E89xeYnFyQUGxdCL");

		// Second sequence should contain both dependent nodes
		expect(sequencesArray[1].workflowId).toBe(complexWorkflowId);
		expect(sequencesArray[1].steps.length).toBe(2);

		// Get the node IDs from the second sequence
		const secondSequenceNodeIds = sequencesArray[1].steps
			.map((step) => step.node.id)
			.sort();
		expect(secondSequenceNodeIds).toEqual(
			["nd-daF6m8YshVoiBARi", "nd-ixIefYTHjZVhpEGq"].sort(),
		);

		// Check generation templates for first sequence
		expect(sequencesArray[0].steps[0].sourceNodes.length).toBe(0);

		// Check generation templates for second sequence nodes
		// Find the node with id nd-ixIefYTHjZVhpEGq
		const ixIefYTHjZVhpEGqNode = sequencesArray[1].steps.find(
			(step) => step.node.id === "nd-ixIefYTHjZVhpEGq",
		);
		expect(ixIefYTHjZVhpEGqNode?.sourceNodes.length).toBe(1);
		expect(ixIefYTHjZVhpEGqNode?.sourceNodes[0].id).toBe("nd-E89xeYnFyQUGxdCL");

		// Find the node with id nd-daF6m8YshVoiBARi
		const daF6m8YshVoiBARiNode = sequencesArray[1].steps.find(
			(step) => step.node.id === "nd-daF6m8YshVoiBARi",
		);
		expect(daF6m8YshVoiBARiNode?.sourceNodes.length).toBe(2);
		expect(daF6m8YshVoiBARiNode?.sourceNodes[0].id).toBe("nd-E89xeYnFyQUGxdCL");
		expect(daF6m8YshVoiBARiNode?.sourceNodes[1].id).toBe("nd-E89xeYnFyQUGxdCL");
	});
});
