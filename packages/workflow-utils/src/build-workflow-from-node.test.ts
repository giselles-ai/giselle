import {
	isTriggerNode,
	type NodeId,
	type Workflow,
	Workspace,
} from "@giselle-sdk/data-type";
import { beforeEach, describe, expect, it, test } from "vitest";
import { buildWorkflowFromNode } from "./build-workflow-from-node";
import workspace1 from "./test/fixtures/workspace1.json";
import workspace2 from "./test/fixtures/workspace2.json";
import workspace3 from "./test/fixtures/workspace3.json";
import { testWorkspace1 } from "./test/test-data";

describe("buildWorkflowForNode with testWorkspace1", () => {
	test("should build a workflow starting from Manual trigger node (nd-y7lLktmBplRvcSov)", () => {
		// Starting node is the Manual trigger
		const startNodeId = "nd-y7lLktmBplRvcSov" as NodeId;
		const startNode = testWorkspace1.nodes.find(
			(node) => node.id === startNodeId,
		);
		if (startNode === undefined) {
			throw new Error(`Node with id ${startNodeId} not found`);
		}

		console.log(testWorkspace1.nodes);
		// Build the workflow starting from the Manual trigger node
		const result = buildWorkflowFromNode(startNode, {
			nodes: testWorkspace1.nodes,
			connections: testWorkspace1.connections,
		});

		expect(result).not.toBeNull();
		if (result) {
			// Check workflow structure
			// The workflow should contain 3 nodes: Manual trigger, Text Generation, Text Generation
			expect(result.nodes.length).toBe(3);

			// The workflow should have 3 sequences, one for each node in the correct order
			expect(result.sequences.length).toBe(3);

			// Check if specific nodes are included in the workflow
			const nodeIds = result.nodes.map((node) => node.id).sort();
			expect(nodeIds).toContain("nd-y7lLktmBplRvcSov"); // Manual trigger
			expect(nodeIds).toContain("nd-7cHfwxtERI9CPAIt"); // Text Generation node
			expect(nodeIds).toContain("nd-1aXA3izp1yV48mPH"); // Text Generation node

			// Should not include nodes from other workflows
			expect(nodeIds).not.toContain("nd-bDa47yWhthNtESN1"); // From different workflow
			expect(nodeIds).not.toContain("nd-d4TuvXgSOSkY5zQQ"); // From different workflow
			expect(nodeIds).not.toContain("nd-jm0L6gvHk4U0eAlz"); // From different workflow
			expect(nodeIds).not.toContain("nd-4KPG1AiUA0mGN94i"); // From different workflow

			// Check sequence dependencies
			// First sequence should be the Manual trigger node
			const sequence1 = result.sequences[0];
			expect(sequence1.steps.length).toBe(1);
			expect(sequence1.steps[0].node.id).toBe("nd-y7lLktmBplRvcSov");
			expect(sequence1.steps[0].sourceNodes.length).toBe(0);

			// Second sequence should be the first Text Generation node
			const sequence2 = result.sequences[1];
			expect(sequence2.steps.length).toBe(1);
			expect(sequence2.steps[0].node.id).toBe("nd-7cHfwxtERI9CPAIt");
			expect(sequence2.steps[0].sourceNodes.length).toBe(1);
			expect(sequence2.steps[0].sourceNodes[0].id).toBe("nd-y7lLktmBplRvcSov");

			// Third sequence should be the second Text Generation node
			const sequence3 = result.sequences[2];
			expect(sequence3.steps.length).toBe(1);
			expect(sequence3.steps[0].node.id).toBe("nd-1aXA3izp1yV48mPH");
			expect(sequence3.steps[0].sourceNodes.length).toBe(1);
			expect(sequence3.steps[0].sourceNodes[0].id).toBe("nd-7cHfwxtERI9CPAIt");
		}
	});
});

describe("buildWorkflowForNode with fixture/workspace1", () => {
	let workspaceData: Workspace;
	let result: Workflow | null;

	beforeEach(() => {
		const workspace = Workspace.safeParse(workspace1);
		expect(workspace.success).toBeTruthy();
		if (!workspace.success) {
			throw new Error("Failed to parse workspace");
		}
		workspaceData = workspace.data;

		const node = workspaceData.nodes.find(
			(n) => n.id === "nd-qRt17h0TP7nQd4Xk",
		);
		if (node === undefined) {
			throw new Error("Node not found");
		}
		result = buildWorkflowFromNode(node, workspaceData);
	});

	it("should build a workflow with 3 sequences", () => {
		expect(result).not.toBeNull();
		expect(result?.sequences.length).toBe(3);
	});

	it("should have first sequence with one step that is a manualTrigger", () => {
		expect(result).not.toBeNull();
		if (result) {
			const firstSequence = result.sequences[0];
			expect(firstSequence.steps.length).toBe(1);
			expect(firstSequence.steps[0].node.id).toBe("nd-qRt17h0TP7nQd4Xk");
			expect(firstSequence.steps[0].node.content.type).toBe("trigger");
		}
	});

	it("should have second sequence with one step that is a textGeneration", () => {
		expect(result).not.toBeNull();
		if (result) {
			const secondSequence = result.sequences[1];
			expect(secondSequence.steps.length).toBe(1);
			expect(secondSequence.steps[0].node.id).toBe("nd-LsNVgNj3s1xJjreL");
			expect(secondSequence.steps[0].node.content.type).toBe("textGeneration");
		}
	});

	it("should have third sequence with one step that is an action", () => {
		expect(result).not.toBeNull();
		if (result) {
			const thirdSequence = result.sequences[2];
			expect(thirdSequence.steps.length).toBe(1);
			expect(thirdSequence.steps[0].node.id).toBe("nd-c2tg86XNmMef5SUj");
			expect(thirdSequence.steps[0].node.content.type).toBe("action");
		}
	});

	it("should have the first sequence's node included in the third sequence's sourceNodes", () => {
		expect(result).not.toBeNull();
		if (result) {
			const firstSequenceNodeId = "nd-qRt17h0TP7nQd4Xk";
			const secondSequenceNodeId = "nd-LsNVgNj3s1xJjreL";
			const thirdSequence = result.sequences[2];

			// Check if the sourceNodes of the third sequence include the first sequence's node
			const sourceNodeIds = thirdSequence.steps[0].sourceNodes.map(
				(node) => node.id,
			);
			expect(sourceNodeIds).toContain(firstSequenceNodeId);
			expect(sourceNodeIds).toContain(secondSequenceNodeId);
		}
	});
});

describe("buildWorkflowForNode with testWorkspace2", () => {
	let workspaceData: Workspace;
	let result: Workflow | null;

	beforeEach(() => {
		const workspace = Workspace.safeParse(workspace2);
		expect(workspace.success).toBeTruthy();
		if (!workspace.success) {
			throw new Error("Failed to parse workspace2");
		}
		workspaceData = workspace.data;

		const node = workspaceData.nodes.find(
			(n) => n.id === "nd-Z6YHBDO456UNY6N4",
		);
		if (node === undefined) {
			throw new Error("Node not found");
		}

		// Start from the GitHub trigger node "On Issue Comment Created"
		result = buildWorkflowFromNode(node, workspaceData);
	});

	it("should build a workflow with 3 sequences", () => {
		expect(result).not.toBeNull();
		expect(result?.sequences.length).toBe(3);
	});

	it("should have first sequence with one step that is a GitHub trigger", () => {
		expect(result).not.toBeNull();
		if (result) {
			const firstSequence = result.sequences[0];
			expect(firstSequence.steps.length).toBe(1);
			expect(firstSequence.steps[0].node.id).toBe("nd-Z6YHBDO456UNY6N4");
			expect(firstSequence.steps[0].node.content.type).toBe("trigger");
			if (isTriggerNode(firstSequence.steps[0].node)) {
				expect(firstSequence.steps[0].node.content.provider).toBe("github");
			}
			expect(firstSequence.steps[0].sourceNodes.length).toBe(0);
		}
	});

	it("should have second sequence with one step that is a text generation", () => {
		expect(result).not.toBeNull();
		if (result) {
			const secondSequence = result.sequences[1];
			expect(secondSequence.steps.length).toBe(1);
			expect(secondSequence.steps[0].node.id).toBe("nd-Q68VP2EDCXck0DZg");
			expect(secondSequence.steps[0].node.content.type).toBe("textGeneration");
			expect(secondSequence.steps[0].sourceNodes.length).toBe(1);
			expect(secondSequence.steps[0].sourceNodes[0].id).toBe(
				"nd-Z6YHBDO456UNY6N4",
			);
		}
	});

	it("should have third sequence with one step that is a GitHub action", () => {
		expect(result).not.toBeNull();
		if (result) {
			const thirdSequence = result.sequences[2];
			expect(thirdSequence.steps.length).toBe(1);
			expect(thirdSequence.steps[0].node.id).toBe("nd-9erM0USHKLZVTMsL");
			expect(thirdSequence.steps[0].node.content.type).toBe("action");
		}
	});

	it("should have the third sequence's sourceNodes include both trigger and text generation nodes", () => {
		expect(result).not.toBeNull();
		if (result) {
			const triggerNodeId = "nd-Z6YHBDO456UNY6N4";
			const textGenNodeId = "nd-Q68VP2EDCXck0DZg";
			const thirdSequence = result.sequences[2];

			const sourceNodeIds = thirdSequence.steps[0].sourceNodes.map(
				(node) => node.id,
			);
			expect(sourceNodeIds).toContain(triggerNodeId);
			expect(sourceNodeIds).toContain(textGenNodeId);
			expect(sourceNodeIds.length).toBe(2);
		}
	});

	it("should include all 3 nodes in the workflow", () => {
		expect(result).not.toBeNull();
		if (result) {
			expect(result.nodes.length).toBe(3);

			const nodeIds = result.nodes.map((node) => node.id).sort();
			expect(nodeIds).toContain("nd-Z6YHBDO456UNY6N4"); // GitHub trigger
			expect(nodeIds).toContain("nd-Q68VP2EDCXck0DZg"); // Text generation
			expect(nodeIds).toContain("nd-9erM0USHKLZVTMsL"); // GitHub action
		}
	});

	it("should have text generation node in the workflow", () => {
		expect(result).not.toBeNull();
		if (result) {
			const textGenNode = result.nodes.find(
				(node) => node.id === "nd-Q68VP2EDCXck0DZg",
			);
			expect(textGenNode).toBeDefined();
			expect(textGenNode?.content.type).toBe("textGeneration");
		}
	});

	it("should have proper node names", () => {
		expect(result).not.toBeNull();
		if (result) {
			const triggerNode = result.nodes.find(
				(node) => node.id === "nd-Z6YHBDO456UNY6N4",
			);
			const actionNode = result.nodes.find(
				(node) => node.id === "nd-9erM0USHKLZVTMsL",
			);

			expect(triggerNode?.name).toBe("On Issue Comment Created");
			expect(actionNode?.name).toBe("Create Issue Comment");
		}
	});
});

describe("buildWorkflowForNode with testWorkspace3", () => {
	let workspaceData: Workspace;
	let result: Workflow | null;

	beforeEach(() => {
		const workspace = Workspace.safeParse(workspace3);
		expect(workspace.success).toBeTruthy();
		if (!workspace.success) {
			throw new Error("Failed to parse workspace3");
		}
		workspaceData = workspace.data;
		const node = workspaceData.nodes.find(
			(node) => node.id === "nd-3k5o1XHYgJIuVE9z",
		);
		if (!node) {
			throw new Error("Failed to find node");
		}

		// Start from the GitHub trigger node "On Issue Comment Created"
		result = buildWorkflowFromNode(node, workspaceData);
	});

	it("should build a workflow with 2 sequences", () => {
		expect(result).not.toBeNull();
		expect(result?.sequences.length).toBe(2);
	});

	it("should build a workflow with first sequence has one step", () => {
		expect(result).not.toBeNull();
		expect(result?.sequences[0].steps).toHaveLength(1);
	});
});
