import { Workspace } from "@giselle-ai/data-type";
import { describe, expect, test } from "vitest";
import { backwardTraversalFixture } from "../__fixtures__/backward-traversal";
import { multipleConnectionsSameNodesFixture } from "../__fixtures__/multiple-connections-same-nodes";
import workspace4 from "../__fixtures__/workspace4.json";
import { sliceGraphFromNode } from "./slice-graph-from-node";

describe("slice-graph-from-node", () => {
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
	describe("test with backwardTraversalFixture", () => {
		test("should slice only A flow when starting from Manual Trigger A", () => {
			const startNode = backwardTraversalFixture.nodes.find(
				(node) => node.id === "nd-CWGF6MO4nyzPpjJM",
			);
			if (startNode === undefined) {
				throw new Error("Manual Trigger A not found");
			}

			const { nodes, connections } = sliceGraphFromNode(
				startNode,
				backwardTraversalFixture,
			);

			// Starting from Manual Trigger A should include:
			// - Manual Trigger A itself
			// - TGA2 (forward from Manual Trigger A)
			// - Variable (backward from TGA2)
			// - TGA1 (backward from TGA2)
			const nodeIds = nodes.map((n) => n.id).sort();
			expect(nodeIds).toEqual([
				"nd-CWGF6MO4nyzPpjJM", // Manual Trigger A
				"nd-IRHq5YW3n2CroK79", // TGA2
				"nd-J154bodtpS9bEtx1", // TGA1
				"nd-TuATf8CniAaZuYSk", // Variable
			]);

			// Should NOT include any B flow nodes
			expect(nodeIds).not.toContain("nd-4rgk30ypWv13sOEX"); // Manual Trigger B
			expect(nodeIds).not.toContain("nd-cKT1VnN0HwYhGHBG"); // TGB2
			expect(nodeIds).not.toContain("nd-9gSPuOSKVrDPxLFZ"); // TGB1

			// Should have 3 connections in the A flow
			expect(connections).toHaveLength(3);
			const connectionIds = connections.map((c) => c.id).sort();
			expect(connectionIds).toEqual([
				"cnnc-777MuPE1oXAAKysb", // Variable → TGA2
				"cnnc-ejmL0pjWE8o85r3m", // TGA1 → TGA2
				"cnnc-vYEfxqxb1XLZJaQd", // Manual Trigger A → TGA2
			]);
		});

		test("should slice only B flow when starting from Manual Trigger B", () => {
			const startNode = backwardTraversalFixture.nodes.find(
				(node) => node.id === "nd-4rgk30ypWv13sOEX",
			);
			if (startNode === undefined) {
				throw new Error("Manual Trigger B not found");
			}

			const { nodes, connections } = sliceGraphFromNode(
				startNode,
				backwardTraversalFixture,
			);

			// Starting from Manual Trigger B should include:
			// - Manual Trigger B itself
			// - TGB2 (forward from Manual Trigger B)
			// - Variable (backward from TGB2)
			// - TGB1 (backward from TGB2)
			const nodeIds = nodes.map((n) => n.id).sort();
			expect(nodeIds).toEqual([
				"nd-4rgk30ypWv13sOEX", // Manual Trigger B
				"nd-9gSPuOSKVrDPxLFZ", // TGB1
				"nd-TuATf8CniAaZuYSk", // Variable
				"nd-cKT1VnN0HwYhGHBG", // TGB2
			]);

			// Should NOT include any A flow nodes
			expect(nodeIds).not.toContain("nd-CWGF6MO4nyzPpjJM"); // Manual Trigger A
			expect(nodeIds).not.toContain("nd-IRHq5YW3n2CroK79"); // TGA2
			expect(nodeIds).not.toContain("nd-J154bodtpS9bEtx1"); // TGA1

			// Should have 3 connections in the B flow
			expect(connections).toHaveLength(3);
			const connectionIds = connections.map((c) => c.id).sort();
			expect(connectionIds).toEqual([
				"cnnc-JGf9hBrBsy4DXunz", // TGB1 → TGB2
				"cnnc-QFRBz9Y06xCx80oL", // Manual Trigger B → TGB2
				"cnnc-n8tdkspIpnf72UHP", // Variable → TGB2
			]);
		});
	});

	describe("test with multiple connections between same nodes", () => {
		test("should collect all connections when multiple connections exist between same nodes", () => {
			const startNode = multipleConnectionsSameNodesFixture.nodes.find(
				(node) => node.id === "nd-nwdgrtVwC070isLr",
			);
			if (startNode === undefined) {
				throw new Error("Trigger node not found");
			}

			const { nodes, connections } = sliceGraphFromNode(
				startNode,
				multipleConnectionsSameNodesFixture,
			);

			// Should include both nodes
			expect(nodes).toHaveLength(2);
			const nodeIds = nodes.map((n) => n.id).sort();
			expect(nodeIds).toEqual([
				"nd-PlnxfHCFVLCuVJcb", // Create Issue Comment (Action)
				"nd-nwdgrtVwC070isLr", // On Issue Comment Created (Trigger)
			]);

			// Should collect BOTH connections (not just the first one)
			// This is the key test for the bug fix: find() → filter()
			expect(connections).toHaveLength(2);
			const connectionIds = connections.map((c) => c.id).sort();
			expect(connectionIds).toEqual([
				"cnnc-mzeOjkqocn9YFhlD", // issueNumber → issueNumber
				"cnnc-pf2KwXJAoEEBCE1n", // issueTitle → body
			]);

			// Verify each connection has the correct output/input mapping
			const issueNumberConn = connections.find(
				(c) => c.id === "cnnc-mzeOjkqocn9YFhlD",
			);
			expect(issueNumberConn?.outputId).toBe("otp-dpz92nyiAVTcoLs6"); // issueNumber
			expect(issueNumberConn?.inputId).toBe("inp-rKOQKGqGb7Qeps2X"); // issueNumber

			const issueTitleConn = connections.find(
				(c) => c.id === "cnnc-pf2KwXJAoEEBCE1n",
			);
			expect(issueTitleConn?.outputId).toBe("otp-CTj1biBXwjzZuqNo"); // issueTitle
			expect(issueTitleConn?.inputId).toBe("inp-FiinOx0HrQqamro9"); // body
		});
	});
});
