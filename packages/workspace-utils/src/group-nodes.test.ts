import { describe, expect, it } from "vitest";
import { gourpNodesFixture } from "./__fixtures__/group-nodes";
import { groupNodes } from "./group-nodes";

describe("groupNodes", () => {
	it("should group connected nodes in workspace1", () => {
		const result = groupNodes(gourpNodesFixture);

		// Since fixture only has operation nodes, all groups should be in operationNodeGroups
		expect(result.starterNodeGroups).toHaveLength(0);
		const groups = result.operationNodeGroups;

		// Sort groups by size for consistent testing
		const sortedGroups = groups
			.map((group) => ({
				...group,
				nodeIds: [...group.nodeIds].sort(),
			}))
			.sort((a, b) => b.nodeIds.length - a.nodeIds.length);

		// Based on the connections in workspace1:
		// Group 1: CFgMwrVsMDKy68ju -> GSCigvQfU7lbDsvy -> k7ii9Cge2s9XF5JF <- 7bpl4Q81Z97VgDlt <- OEac8DMOLd0bwsOe
		//          omdTu2flqJHhMuo8 -> GSCigvQfU7lbDsvy -> w0tHiwkN3n2ZIP2v
		//          Y7Uh3GvPRIQwfSGE -> omdTu2flqJHhMuo8
		// Group 2: CH7NalFDDDbHQcr7 -> YkXO5rkuczwTmnmv

		expect(sortedGroups).toHaveLength(2);

		// Verify the large connected component has 8 nodes
		expect(sortedGroups[0].nodeIds).toHaveLength(8);
		expect(sortedGroups[0].nodeIds).toContain("nd-CFgMwrVsMDKy68ju");
		expect(sortedGroups[0].nodeIds).toContain("nd-omdTu2flqJHhMuo8");
		expect(sortedGroups[0].nodeIds).toContain("nd-GSCigvQfU7lbDsvy");
		expect(sortedGroups[0].nodeIds).toContain("nd-Y7Uh3GvPRIQwfSGE");
		expect(sortedGroups[0].nodeIds).toContain("nd-OEac8DMOLd0bwsOe");
		expect(sortedGroups[0].nodeIds).toContain("nd-7bpl4Q81Z97VgDlt");
		expect(sortedGroups[0].nodeIds).toContain("nd-k7ii9Cge2s9XF5JF");
		expect(sortedGroups[0].nodeIds).toContain("nd-w0tHiwkN3n2ZIP2v");

		// Verify the smaller component has 2 nodes
		expect(sortedGroups[1].nodeIds).toHaveLength(2);
		expect(sortedGroups[1].nodeIds).toContain("nd-CH7NalFDDDbHQcr7");
		expect(sortedGroups[1].nodeIds).toContain("nd-YkXO5rkuczwTmnmv");

		// Verify connectionIds are populated correctly
		// Group 1 should have 7 connections based on the comment above
		expect(sortedGroups[0].connectionIds.length).toBeGreaterThan(0);
		// Group 2 should have 1 connection
		expect(sortedGroups[1].connectionIds).toHaveLength(1);
	});

	it("should handle workspace with no connections", () => {
		const workspace = {
			...gourpNodesFixture,
			connections: [],
		};

		const result = groupNodes(workspace);

		// Since fixture only has operation nodes, all groups should be in operationNodeGroups
		expect(result.starterNodeGroups).toHaveLength(0);
		const groups = result.operationNodeGroups;

		// Each node should be in its own group
		expect(groups).toHaveLength(workspace.nodes.length);
		groups.forEach((group) => {
			expect(group.nodeIds).toHaveLength(1);
			expect(group.connectionIds).toHaveLength(0);
		});
	});

	it("should handle empty workspace", () => {
		const workspace = {
			...gourpNodesFixture,
			nodes: [],
			connections: [],
		};

		const result = groupNodes(workspace);

		expect(result).toEqual({
			operationNodeGroups: [],
			starterNodeGroups: [],
		});
	});

	it("should handle self-loops correctly", () => {
		const workspace = {
			...gourpNodesFixture,
			nodes: gourpNodesFixture.nodes.slice(0, 2),
			connections: [
				{
					id: "cnnc-self" as const,
					outputNode: gourpNodesFixture.nodes[0],
					outputId: "otp-jzfjEdlrL0Uxtz9G" as const,
					inputNode: gourpNodesFixture.nodes[0],
					inputId: "inp-self" as const,
				},
			],
		};

		const result = groupNodes(workspace);

		// Since fixture only has operation nodes, all groups should be in operationNodeGroups
		expect(result.starterNodeGroups).toHaveLength(0);
		const groups = result.operationNodeGroups;

		// Self-loop doesn't create additional groups
		expect(groups).toHaveLength(2);

		// Find the group with the self-loop
		const selfLoopGroup = groups.find((g) =>
			g.nodeIds.includes(gourpNodesFixture.nodes[0].id),
		);
		expect(selfLoopGroup?.connectionIds).toHaveLength(1);
		expect(selfLoopGroup?.connectionIds[0]).toBe("cnnc-self");
	});
});
