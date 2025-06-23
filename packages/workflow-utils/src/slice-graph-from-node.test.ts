import { Workspace } from "@giselle-sdk/data-type";
import { describe, expect, test } from "vitest";
import { sliceGraphFromNode } from "./slice-graph-from-node";
import workspace4 from "./test/fixtures/workspace4.json";
import { testWorkspace1 } from "./test/test-data";

describe("slice-graph-from-node", () => {
	describe("test with testWorkspace1", () => {
		describe("start with nd-y7lLktmBplRvcSov", () => {
			test("should has three nodes", () => {
				const startNode = testWorkspace1.nodes.find(
					(node) => node.id === "nd-y7lLktmBplRvcSov",
				);
				if (startNode === undefined) {
					throw new Error("startNode is undefined");
				}
				const { nodes } = sliceGraphFromNode(startNode, testWorkspace1);
				expect(nodes).toHaveLength(3);
			});
		});
	});
	describe("test with workspace4.json", () => {
		describe("start with nd-y7lLktmBplRvcSov", () => {
			test("should has three nodes", () => {
				const workspace = Workspace.parse(workspace4);
				const startNode = workspace.nodes.find(
					(node) => node.id === "nd-EvtraAYLc3SoHIFZ",
				);
				if (startNode === undefined) {
					throw new Error("startNode is undefined");
				}
				const { nodes } = sliceGraphFromNode(startNode, workspace);

				expect(nodes).toHaveLength(3);
			});
		});
	});
});
