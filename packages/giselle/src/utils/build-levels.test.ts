import {
	type Connection,
	ConnectionId,
	InputId,
	NodeId,
	type NodeLike,
	OutputId,
} from "@giselles-ai/protocol";
import { describe, expect, it } from "vitest";
import { twoTriggerFixture } from "./__fixtures__/two-trigger";
import { buildLevels } from "./build-levels";

describe("buildLevels", () => {
	describe("parallel execution", () => {
		const triggerNodeId = NodeId.generate();
		const parallel1NodeId = NodeId.generate();
		const parallel2NodeId = NodeId.generate();
		const finalNodeId = NodeId.generate();

		const triggerOutput1Id = OutputId.generate();
		const triggerOutput2Id = OutputId.generate();
		const parallel1InputId = InputId.generate();
		const parallel2InputId = InputId.generate();
		const parallel1OutputId = OutputId.generate();
		const parallel2OutputId = OutputId.generate();
		const finalInput1Id = InputId.generate();
		const finalInput2Id = InputId.generate();
		const finalOutputId = OutputId.generate();

		const nodes: NodeLike[] = [
			{
				id: triggerNodeId,
				name: "Trigger",
				type: "operation",
				inputs: [],
				outputs: [
					{ id: triggerOutput1Id, label: "Output 1", accessor: "output1" },
					{ id: triggerOutput2Id, label: "Output 2", accessor: "output2" },
				],
				content: { type: "trigger" },
			},
			{
				id: parallel1NodeId,
				name: "Parallel 1",
				type: "operation",
				inputs: [{ id: parallel1InputId, label: "Input", accessor: "input" }],
				outputs: [
					{ id: parallel1OutputId, label: "Output", accessor: "output" },
				],
				content: { type: "textGeneration" },
			},
			{
				id: parallel2NodeId,
				name: "Parallel 2",
				type: "operation",
				inputs: [{ id: parallel2InputId, label: "Input", accessor: "input" }],
				outputs: [
					{ id: parallel2OutputId, label: "Output", accessor: "output" },
				],
				content: { type: "textGeneration" },
			},
			{
				id: finalNodeId,
				name: "Final",
				type: "operation",
				inputs: [
					{ id: finalInput1Id, label: "Input 1", accessor: "input1" },
					{ id: finalInput2Id, label: "Input 2", accessor: "input2" },
				],
				outputs: [{ id: finalOutputId, label: "Output", accessor: "output" }],
				content: { type: "textGeneration" },
			},
		];

		const connections: Connection[] = [
			{
				id: ConnectionId.generate(),
				outputNode: {
					id: triggerNodeId,
					type: "operation",
					content: { type: "trigger" },
				},
				outputId: triggerOutput1Id,
				inputNode: {
					id: parallel1NodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				inputId: parallel1InputId,
			},
			{
				id: ConnectionId.generate(),
				outputNode: {
					id: triggerNodeId,
					type: "operation",
					content: { type: "trigger" },
				},
				outputId: triggerOutput2Id,
				inputNode: {
					id: parallel2NodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				inputId: parallel2InputId,
			},
			{
				id: ConnectionId.generate(),
				outputNode: {
					id: parallel1NodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				outputId: parallel1OutputId,
				inputNode: {
					id: finalNodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				inputId: finalInput1Id,
			},
			{
				id: ConnectionId.generate(),
				outputNode: {
					id: parallel2NodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				outputId: parallel2OutputId,
				inputNode: {
					id: finalNodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				inputId: finalInput2Id,
			},
		];

		it("should group parallel nodes in the same level", () => {
			const levels = buildLevels(nodes, connections);

			expect(levels).toHaveLength(3);
			expect(levels[0]).toEqual([triggerNodeId]);
			expect(levels[1]).toEqual(
				expect.arrayContaining([parallel1NodeId, parallel2NodeId]),
			);
			expect(levels[1]).toHaveLength(2);
			expect(levels[2]).toEqual([finalNodeId]);
		});
	});

	describe("mixed node types", () => {
		const triggerNodeId = NodeId.generate();
		const variableNodeId = NodeId.generate();
		const operationNodeId = NodeId.generate();

		const triggerOutputId = OutputId.generate();
		const variableOutputId = OutputId.generate();
		const operationInput1Id = InputId.generate();
		const operationInput2Id = InputId.generate();
		const operationOutputId = OutputId.generate();

		const nodes: NodeLike[] = [
			{
				id: triggerNodeId,
				name: "Trigger",
				type: "operation",
				inputs: [],
				outputs: [{ id: triggerOutputId, label: "Output", accessor: "output" }],
				content: { type: "trigger" },
			},
			{
				id: variableNodeId,
				name: "Variable",
				type: "variable",
				inputs: [],
				outputs: [{ id: variableOutputId, label: "Text", accessor: "text" }],
				content: { type: "text", text: "Hello World" },
			},
			{
				id: operationNodeId,
				name: "Operation",
				type: "operation",
				inputs: [
					{ id: operationInput1Id, label: "Input 1", accessor: "input1" },
					{ id: operationInput2Id, label: "Input 2", accessor: "input2" },
				],
				outputs: [
					{ id: operationOutputId, label: "Output", accessor: "output" },
				],
				content: { type: "textGeneration" },
			},
		];

		const connections: Connection[] = [
			{
				id: ConnectionId.generate(),
				outputNode: {
					id: triggerNodeId,
					type: "operation",
					content: { type: "trigger" },
				},
				outputId: triggerOutputId,
				inputNode: {
					id: operationNodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				inputId: operationInput1Id,
			},
			{
				id: ConnectionId.generate(),
				outputNode: {
					id: variableNodeId,
					type: "variable",
					content: { type: "text" },
				},
				outputId: variableOutputId,
				inputNode: {
					id: operationNodeId,
					type: "operation",
					content: { type: "textGeneration" },
				},
				inputId: operationInput2Id,
			},
		];

		it("should only include operation nodes in levels", () => {
			const levels = buildLevels(nodes, connections);

			expect(levels).toHaveLength(2);
			expect(levels[0]).toEqual([triggerNodeId]);
			expect(levels[1]).toEqual([operationNodeId]);

			// Variable node should not appear in any level
			const allNodeIds = levels.flat();
			expect(allNodeIds).not.toContain(variableNodeId);
		});
	});

	describe("twoTriggerFixture - complex real-world scenario", () => {
		it("should handle multiple trigger flows with filtered connections", () => {
			// Filter connections to specific connectionIds as used in createTask
			const specificConnectionIds = [
				"cnnc-PoESuO0NCdNDXRLa",
				"cnnc-0I4tbbZ9q1xbHl77",
				"cnnc-xG7dUsEsbSyBcB7J",
				"cnnc-fj7JqjEbDUXReeHH",
				"cnnc-5HwEW7oxzuaE5FIO",
				"cnnc-gdpj7KitsaXvvcPg",
				"cnnc-gH6BCfvsfjiSk4Hz",
				"cnnc-Xh2YmFlB0EzMN7NW",
				"cnnc-SyQDKqDxgRXd5MEC",
			];

			const filteredConnections = twoTriggerFixture.connections.filter(
				(connection) => specificConnectionIds.includes(connection.id),
			);

			const levels = buildLevels(twoTriggerFixture.nodes, filteredConnections);

			// Should have multiple levels due to dependencies
			expect(levels.length).toBeGreaterThan(0);

			// With filtered connections, only connected operation nodes should be included
			const allNodeIds = levels.flat();

			// These are all the operation nodes involved in the filtered connections (Flow 2):
			// - nd-FoP9shtlUFMU5zcI: "On Pull Request Opened" (trigger)
			// - nd-ZEMYDrI7lolEeMEJ: "Manual QA" (receives from trigger and template)
			// - nd-pLEJoQT8VDAJ1Ewx: "Prompt for AI Agents" (receives from trigger and template)
			// - nd-tvQwRmbPhKA69OgT: "Create a Comment for PR" (receives from Manual QA, Prompt AI, and template)
			// - nd-le8wUlKPyfeueTTP: "Create Pull Request Comment" (receives from trigger and Create Comment)
			expect(allNodeIds).toContain("nd-FoP9shtlUFMU5zcI"); // "On Pull Request Opened"
			expect(allNodeIds).toContain("nd-ZEMYDrI7lolEeMEJ"); // "Manual QA" (Flow 2)
			expect(allNodeIds).toContain("nd-pLEJoQT8VDAJ1Ewx"); // "Prompt for AI Agents" (Flow 2)
			expect(allNodeIds).toContain("nd-tvQwRmbPhKA69OgT"); // "Create a Comment for PR" (Flow 2)
			expect(allNodeIds).toContain("nd-le8wUlKPyfeueTTP"); // "Create Pull Request Comment" (Flow 2)

			// buildLevels includes ALL operation nodes, regardless of filtered connections
			// The filtering only affects the dependency relationships, not which nodes are included
			expect(allNodeIds).toHaveLength(10); // All 10 operation nodes should be included

			// All operation nodes should be included (both Flow 1 and Flow 2)
			expect(allNodeIds).toContain("nd-5JoATar9nEGbObfu"); // "On Pull Request Ready for Review" (Flow 1 trigger)
			expect(allNodeIds).toContain("nd-ySQi0YbUMoNsELO3"); // "Manual QA" (Flow 1)
			expect(allNodeIds).toContain("nd-0RVsikMQqKwRMWuZ"); // "Prompt for AI Agents" (Flow 1)
			expect(allNodeIds).toContain("nd-worigWCbqYT9Ofye"); // "Create a Comment for PR" (Flow 1)
			expect(allNodeIds).toContain("nd-Dd7brCDUvMmBK9De"); // "Create Pull Request Comment" (Flow 1)
		});

		it("should not include variable nodes in execution levels with filtered connections", () => {
			// Filter connections to specific connectionIds
			const specificConnectionIds = [
				"cnnc-PoESuO0NCdNDXRLa",
				"cnnc-0I4tbbZ9q1xbHl77",
				"cnnc-xG7dUsEsbSyBcB7J",
				"cnnc-fj7JqjEbDUXReeHH",
				"cnnc-5HwEW7oxzuaE5FIO",
				"cnnc-gdpj7KitsaXvvcPg",
				"cnnc-gH6BCfvsfjiSk4Hz",
				"cnnc-Xh2YmFlB0EzMN7NW",
				"cnnc-SyQDKqDxgRXd5MEC",
			];

			const filteredConnections = twoTriggerFixture.connections.filter(
				(connection) => specificConnectionIds.includes(connection.id),
			);

			const levels = buildLevels(twoTriggerFixture.nodes, filteredConnections);
			const allNodeIds = levels.flat();

			// Template variables should not appear in execution levels
			expect(allNodeIds).not.toContain("nd-xcv9NFBilDvWKyYG"); // "Template for commenting on pull requests"
			expect(allNodeIds).not.toContain("nd-0gHqrsQ63D3oD6H9"); // "Template - Manual QA"
			expect(allNodeIds).not.toContain("nd-SP2PD7natQF8f2yH"); // "Template - Prompt for AI Agents"
		});

		it("should ensure proper dependency order within filtered flow", () => {
			// Filter connections to specific connectionIds
			const specificConnectionIds = [
				"cnnc-PoESuO0NCdNDXRLa",
				"cnnc-0I4tbbZ9q1xbHl77",
				"cnnc-xG7dUsEsbSyBcB7J",
				"cnnc-fj7JqjEbDUXReeHH",
				"cnnc-5HwEW7oxzuaE5FIO",
				"cnnc-gdpj7KitsaXvvcPg",
				"cnnc-gH6BCfvsfjiSk4Hz",
				"cnnc-Xh2YmFlB0EzMN7NW",
				"cnnc-SyQDKqDxgRXd5MEC",
			];

			const filteredConnections = twoTriggerFixture.connections.filter(
				(connection) => specificConnectionIds.includes(connection.id),
			);

			const levels = buildLevels(twoTriggerFixture.nodes, filteredConnections);

			// Find the level of each key node
			const getNodeLevel = (nodeId: NodeId) => {
				for (let i = 0; i < levels.length; i++) {
					if (levels[i].includes(nodeId)) {
						return i;
					}
				}
				return -1;
			};

			// With filtered connections, only Flow 2 should be included
			// nd-FoP9shtlUFMU5zcI (trigger) should be at level 0
			const trigger2Level = getNodeLevel("nd-FoP9shtlUFMU5zcI");
			expect(trigger2Level).toBe(0);

			// Dependent nodes should be in later levels than their dependencies
			const manualQA2Level = getNodeLevel("nd-ZEMYDrI7lolEeMEJ");
			const promptAI2Level = getNodeLevel("nd-pLEJoQT8VDAJ1Ewx");
			const comment2Level = getNodeLevel("nd-tvQwRmbPhKA69OgT");
			const action2Level = getNodeLevel("nd-le8wUlKPyfeueTTP");

			// All should be found and in proper order
			expect(manualQA2Level).toBeGreaterThan(trigger2Level);
			expect(promptAI2Level).toBeGreaterThan(trigger2Level);
			expect(comment2Level).toBeGreaterThan(manualQA2Level);
			expect(comment2Level).toBeGreaterThan(promptAI2Level);
			expect(action2Level).toBeGreaterThan(comment2Level);
		});
	});

	describe("edge cases", () => {
		it("should handle empty inputs", () => {
			const levels = buildLevels([], []);
			expect(levels).toEqual([]);
		});

		it("should handle nodes with no connections", () => {
			const isolatedNodeId = NodeId.generate();
			const nodes: NodeLike[] = [
				{
					id: isolatedNodeId,
					name: "Isolated",
					type: "operation",
					inputs: [],
					outputs: [],
					content: { type: "textGeneration" },
				},
			];

			const levels = buildLevels(nodes, []);
			expect(levels).toEqual([[isolatedNodeId]]);
		});

		it("should handle duplicate connections gracefully", () => {
			const node1Id = NodeId.generate();
			const node2Id = NodeId.generate();
			const node1OutputId = OutputId.generate();
			const node2InputId = InputId.generate();

			const nodes: NodeLike[] = [
				{
					id: node1Id,
					name: "Node 1",
					type: "operation",
					inputs: [],
					outputs: [{ id: node1OutputId, label: "Output", accessor: "output" }],
					content: { type: "textGeneration" },
				},
				{
					id: node2Id,
					name: "Node 2",
					type: "operation",
					inputs: [{ id: node2InputId, label: "Input", accessor: "input" }],
					outputs: [],
					content: { type: "textGeneration" },
				},
			];

			const connections: Connection[] = [
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: node1Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: node1OutputId,
					inputNode: {
						id: node2Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: node2InputId,
				},
				{
					id: ConnectionId.generate(), // Duplicate connection
					outputNode: {
						id: node1Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: node1OutputId,
					inputNode: {
						id: node2Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: node2InputId,
				},
			];

			const levels = buildLevels(nodes, connections);
			expect(levels).toEqual([[node1Id], [node2Id]]);
		});

		it("should handle many duplicate connections and maintain correct in-degrees", () => {
			// Regression test for the bug where duplicate connections
			// were causing negative in-degrees during decrement phase
			const triggerNodeId = NodeId.generate();
			const middleNodeId = NodeId.generate();
			const finalNodeId = NodeId.generate();

			const triggerOutputId = OutputId.generate();
			const middleInputId = InputId.generate();
			const middleOutputId = OutputId.generate();
			const finalInput1Id = InputId.generate();
			const finalInput2Id = InputId.generate();

			const nodes: NodeLike[] = [
				{
					id: triggerNodeId,
					name: "Trigger",
					type: "operation",
					inputs: [],
					outputs: [
						{ id: triggerOutputId, label: "Output", accessor: "output" },
					],
					content: { type: "trigger" },
				},
				{
					id: middleNodeId,
					name: "Middle",
					type: "operation",
					inputs: [{ id: middleInputId, label: "Input", accessor: "input" }],
					outputs: [
						{ id: middleOutputId, label: "Output", accessor: "output" },
					],
					content: { type: "textGeneration" },
				},
				{
					id: finalNodeId,
					name: "Final",
					type: "operation",
					inputs: [
						{ id: finalInput1Id, label: "Input 1", accessor: "input1" },
						{ id: finalInput2Id, label: "Input 2", accessor: "input2" },
					],
					outputs: [],
					content: { type: "action" },
				},
			];

			const connections: Connection[] = [
				// 5 duplicate connections: Trigger → Middle
				...Array.from(
					{ length: 5 },
					() =>
						({
							id: ConnectionId.generate(),
							outputNode: {
								id: triggerNodeId,
								type: "operation",
								content: { type: "trigger" },
							},
							outputId: triggerOutputId,
							inputNode: {
								id: middleNodeId,
								type: "operation",
								content: { type: "textGeneration" },
							},
							inputId: middleInputId,
						}) satisfies Connection,
				),
				// 2 duplicate connections: Trigger → Final
				...Array.from(
					{ length: 2 },
					() =>
						({
							id: ConnectionId.generate(),
							outputNode: {
								id: triggerNodeId,
								type: "operation",
								content: { type: "trigger" },
							},
							outputId: triggerOutputId,
							inputNode: {
								id: finalNodeId,
								type: "operation",
								content: { type: "action" },
							},
							inputId: finalInput1Id,
						}) satisfies Connection,
				),
				// 1 connection: Middle → Final
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: middleNodeId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: middleOutputId,
					inputNode: {
						id: finalNodeId,
						type: "operation",
						content: { type: "action" },
					},
					inputId: finalInput2Id,
				},
			];

			const levels = buildLevels(nodes, connections);

			// This is the critical assertion that fails with the bug:
			// Without the fix, Middle gets in-degree of -4 after Level 0,
			// causing Final to be placed before Middle
			expect(levels).toHaveLength(3);
			expect(levels[0]).toEqual([triggerNodeId]);
			expect(levels[1]).toEqual([middleNodeId]); // Bug causes Final here instead
			expect(levels[2]).toEqual([finalNodeId]); // Bug causes Middle here instead
		});

		it("should break cycles gracefully", () => {
			const node1Id = NodeId.generate();
			const node2Id = NodeId.generate();
			const node1InputId = InputId.generate();
			const node1OutputId = OutputId.generate();
			const node2InputId = InputId.generate();
			const node2OutputId = OutputId.generate();

			const nodes: NodeLike[] = [
				{
					id: node1Id,
					name: "Node 1",
					type: "operation",
					inputs: [{ id: node1InputId, label: "Input", accessor: "input" }],
					outputs: [{ id: node1OutputId, label: "Output", accessor: "output" }],
					content: { type: "textGeneration" },
				},
				{
					id: node2Id,
					name: "Node 2",
					type: "operation",
					inputs: [{ id: node2InputId, label: "Input", accessor: "input" }],
					outputs: [{ id: node2OutputId, label: "Output", accessor: "output" }],
					content: { type: "textGeneration" },
				},
			];

			const connections: Connection[] = [
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: node1Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: node1OutputId,
					inputNode: {
						id: node2Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: node2InputId,
				},
				{
					id: ConnectionId.generate(), // Creates a cycle
					outputNode: {
						id: node2Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: node2OutputId,
					inputNode: {
						id: node1Id,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: node1InputId,
				},
			];

			const levels = buildLevels(nodes, connections);
			// Should terminate gracefully without infinite loop
			expect(levels).toBeDefined();
			expect(Array.isArray(levels)).toBe(true);
		});

		it("should not place cyclic nodes in the same level", () => {
			// Create a simple cycle: A -> B -> A
			const nodeAId = NodeId.generate();
			const nodeBId = NodeId.generate();
			const nodeAInputId = InputId.generate();
			const nodeAOutputId = OutputId.generate();
			const nodeBInputId = InputId.generate();
			const nodeBOutputId = OutputId.generate();

			const nodes: NodeLike[] = [
				{
					id: nodeAId,
					name: "Cycle Node A",
					type: "operation",
					inputs: [{ id: nodeAInputId, label: "Input", accessor: "input" }],
					outputs: [{ id: nodeAOutputId, label: "Output", accessor: "output" }],
					content: { type: "textGeneration" },
				},
				{
					id: nodeBId,
					name: "Cycle Node B",
					type: "operation",
					inputs: [{ id: nodeBInputId, label: "Input", accessor: "input" }],
					outputs: [{ id: nodeBOutputId, label: "Output", accessor: "output" }],
					content: { type: "textGeneration" },
				},
			];

			const connections: Connection[] = [
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: nodeAId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: nodeAOutputId,
					inputNode: {
						id: nodeBId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: nodeBInputId,
				},
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: nodeBId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: nodeBOutputId,
					inputNode: {
						id: nodeAId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: nodeAInputId,
				},
			];

			const levels = buildLevels(nodes, connections);

			// Nodes in a cycle should NOT be in the same level
			expect(levels.length).toBe(2);
			expect(levels[0].length).toBe(1);
			expect(levels[1].length).toBe(1);

			// Verify both nodes are included but in different levels
			const allNodes = levels.flat();
			expect(allNodes).toContain(nodeAId);
			expect(allNodes).toContain(nodeBId);
		});

		it("should handle complex cycles with multiple nodes", () => {
			// Create a more complex cycle: A -> B -> C -> A, with D -> B
			const complexAId = NodeId.generate();
			const complexBId = NodeId.generate();
			const complexCId = NodeId.generate();
			const complexDId = NodeId.generate();

			const complexAInputId = InputId.generate();
			const complexAOutputId = OutputId.generate();
			const complexBInputId = InputId.generate();
			const complexBInput2Id = InputId.generate();
			const complexBOutputId = OutputId.generate();
			const complexCInputId = InputId.generate();
			const complexCOutputId = OutputId.generate();
			const complexDOutputId = OutputId.generate();

			const nodes: NodeLike[] = [
				{
					id: complexAId,
					name: "Complex A",
					type: "operation",
					inputs: [{ id: complexAInputId, label: "Input", accessor: "input" }],
					outputs: [
						{ id: complexAOutputId, label: "Output", accessor: "output" },
					],
					content: { type: "textGeneration" },
				},
				{
					id: complexBId,
					name: "Complex B",
					type: "operation",
					inputs: [
						{ id: complexBInputId, label: "Input", accessor: "input" },
						{ id: complexBInput2Id, label: "Input 2", accessor: "input2" },
					],
					outputs: [
						{ id: complexBOutputId, label: "Output", accessor: "output" },
					],
					content: { type: "textGeneration" },
				},
				{
					id: complexCId,
					name: "Complex C",
					type: "operation",
					inputs: [{ id: complexCInputId, label: "Input", accessor: "input" }],
					outputs: [
						{ id: complexCOutputId, label: "Output", accessor: "output" },
					],
					content: { type: "textGeneration" },
				},
				{
					id: complexDId,
					name: "Complex D",
					type: "operation",
					inputs: [],
					outputs: [
						{ id: complexDOutputId, label: "Output", accessor: "output" },
					],
					content: { type: "textGeneration" },
				},
			];

			const connections: Connection[] = [
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: complexAId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: complexAOutputId,
					inputNode: {
						id: complexBId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: complexBInputId,
				},
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: complexBId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: complexBOutputId,
					inputNode: {
						id: complexCId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: complexCInputId,
				},
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: complexCId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: complexCOutputId,
					inputNode: {
						id: complexAId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: complexAInputId,
				},
				{
					id: ConnectionId.generate(),
					outputNode: {
						id: complexDId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					outputId: complexDOutputId,
					inputNode: {
						id: complexBId,
						type: "operation",
						content: { type: "textGeneration" },
					},
					inputId: complexBInput2Id,
				},
			];

			const levels = buildLevels(nodes, connections);

			// D should be in the first level (no dependencies)
			expect(levels[0]).toContain(complexDId);

			// The cycle nodes (A, B, C) should be in different levels
			const levelMap = new Map<string, number>();
			for (let i = 0; i < levels.length; i++) {
				for (const nodeId of levels[i]) {
					levelMap.set(nodeId, i);
				}
			}

			// All nodes should be included
			expect(levelMap.size).toBe(4);

			// Nodes in the cycle should not all be in the same level
			const cycleNodeLevels = [
				levelMap.get(complexAId),
				levelMap.get(complexBId),
				levelMap.get(complexCId),
			].filter((l) => l !== undefined);

			const uniqueLevels = new Set(cycleNodeLevels);
			expect(uniqueLevels.size).toBeGreaterThan(1);
		});
	});
});
