import type {
	Connection,
	ConnectionId,
	Node,
	NodeId,
} from "@giselle-sdk/data-type";
import { describe, expect, test } from "vitest";
import { buildWorkflowFromNode } from "./build-workflow-from-node";
import { testWorkspace1 } from "./test/test-data";

describe("buildWorkflowFromNode with testWorkspace1", () => {
	test("should build a workflow starting from Manual trigger node (nd-y7lLktmBplRvcSov)", () => {
		// Starting node is the Manual trigger
		const startNodeId = "nd-y7lLktmBplRvcSov" as NodeId;

		// Build the workflow starting from the Manual trigger node
		const result = buildWorkflowFromNode(
			startNodeId,
			testWorkspace1.nodes,
			testWorkspace1.connections,
		);

		expect(result).not.toBeNull();
		if (result) {
			// Check workflow structure
			// The workflow should contain 3 nodes: Manual trigger, Text Generation, Text Generation
			expect(result.nodes.length).toBe(3);

			// The workflow should have 3 jobs, one for each node in the correct order
			expect(result.jobs.length).toBe(3);

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

			// Check job dependencies
			// First job should be the Manual trigger node
			const job1 = result.jobs[0];
			expect(job1.operations.length).toBe(1);
			expect(job1.operations[0].node.id).toBe("nd-y7lLktmBplRvcSov");
			expect(job1.operations[0].generationTemplate.sourceNodes.length).toBe(0);

			// Second job should be the first Text Generation node
			const job2 = result.jobs[1];
			expect(job2.operations.length).toBe(1);
			expect(job2.operations[0].node.id).toBe("nd-7cHfwxtERI9CPAIt");
			expect(job2.operations[0].generationTemplate.sourceNodes.length).toBe(1);
			expect(job2.operations[0].generationTemplate.sourceNodes[0].id).toBe(
				"nd-y7lLktmBplRvcSov",
			);

			// Third job should be the second Text Generation node
			const job3 = result.jobs[2];
			expect(job3.operations.length).toBe(1);
			expect(job3.operations[0].node.id).toBe("nd-1aXA3izp1yV48mPH");
			expect(job3.operations[0].generationTemplate.sourceNodes.length).toBe(1);
			expect(job3.operations[0].generationTemplate.sourceNodes[0].id).toBe(
				"nd-7cHfwxtERI9CPAIt",
			);
		}
	});
});
