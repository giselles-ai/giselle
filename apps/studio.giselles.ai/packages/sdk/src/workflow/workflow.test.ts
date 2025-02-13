import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { WorkflowData } from "../node/workflow-state";
import type { Workflow } from "./types";
import { initWorkflow } from "./workflow";

// Helper functions
function createTestTextGenerationNode(
	workflow: Workflow,
	{
		name = "Test Node",
		instruction = "Test instruction",
		position = { x: 100, y: 100 },
	} = {},
) {
	return workflow.addTextGenerationNode(
		{
			name,
			llm: "openai:gpt-4o",
			temperature: 0.7,
			topP: 1,
			instruction,
			sources: [],
		},
		{
			ui: {
				position,
				selected: false,
			},
		},
	);
}

function createTestTextNode(
	workflow: Workflow,
	{
		name = "Test Text Node",
		text = "Test text content",
		position = { x: 100, y: 100 },
	} = {},
) {
	return workflow.addTextNode(
		{
			name,
			text,
		},
		{
			ui: {
				position,
				selected: false,
			},
		},
	);
}

async function getWorkflowFileContent(
	directory: string,
): Promise<WorkflowData> {
	const files = await fs.readdir(directory);
	const workflowFile = files[0];
	const content = await fs.readFile(
		path.join(directory, workflowFile),
		"utf-8",
	);
	return JSON.parse(content);
}

describe("Workflow", () => {
	let workflow: Workflow;
	const TEST_STORAGE_DIR = "./.test-storage";

	beforeEach(() => {
		workflow = initWorkflow({
			storage: {
				type: "localfilesystem",
				directory: TEST_STORAGE_DIR,
			},
		});
	});

	afterEach(async () => {
		try {
			await fs.rm(TEST_STORAGE_DIR, { recursive: true, force: true });
		} catch (error) {
			// Ignore if directory doesn't exist
		}
	});

	describe("Node Creation", () => {
		it("should create a text generation node with correct properties", () => {
			const node = createTestTextGenerationNode(workflow, {
				name: "Story Generator",
				instruction: "Write a short story about a cat",
			});

			expect(node).toBeDefined();
			expect(node.name).toBe("Story Generator");
			expect(node.type).toBe("action");
			expect(node.content).toMatchObject({
				type: "textGeneration",
				llm: "openai:gpt-4o",
				temperature: 0.7,
				topP: 1,
				instruction: "Write a short story about a cat",
				sources: [],
			});
		});

		it("should create a text node with correct properties", () => {
			const node = createTestTextNode(workflow, {
				name: "Input Text",
				text: "Hello, world!",
			});

			expect(node).toBeDefined();
			expect(node.name).toBe("Input Text");
			expect(node.type).toBe("variable");
			expect(node.content).toMatchObject({
				type: "text",
				text: "Hello, world!",
			});
		});
	});

	describe("Node Connections", () => {
		it("should connect text generation nodes as sources", async () => {
			const sourceNode = createTestTextGenerationNode(workflow, {
				name: "Source Node",
				instruction: "First instruction",
			});

			const targetNode = createTestTextGenerationNode(workflow, {
				name: "Target Node",
				instruction: "Second instruction",
			});

			targetNode.addSources([sourceNode]);
			await workflow.save();

			const savedState = await getWorkflowFileContent(TEST_STORAGE_DIR);

			// Verify connection in the workflow state
			expect(savedState.connections).toHaveLength(1);
			expect(savedState.connections[0].sourceNodeId).toBe(sourceNode.id);
			expect(savedState.connections[0].targetNodeId).toBe(targetNode.id);

			// Verify source in target node's content
			const targetNodeData = savedState.nodes[targetNode.id].data;
			if (targetNodeData.content.type === "textGeneration") {
				expect(targetNodeData.content.sources).toHaveLength(1);
				expect(targetNodeData.content.sources[0].connectedSourceNodeId).toBe(
					sourceNode.id,
				);
			}
		});

		it("should connect text nodes as sources to text generation nodes", async () => {
			const textNode = createTestTextNode(workflow, {
				name: "Text Source",
				text: "Source content",
			});

			const genNode = createTestTextGenerationNode(workflow, {
				name: "Target Node",
				instruction: "Use the text source",
			});

			genNode.addSources([textNode]);
			await workflow.save();

			const savedState = await getWorkflowFileContent(TEST_STORAGE_DIR);

			expect(savedState.connections).toHaveLength(1);
			expect(savedState.connections[0].sourceNodeId).toBe(textNode.id);
			expect(savedState.connections[0].targetNodeId).toBe(genNode.id);

			const genNodeData = savedState.nodes[genNode.id].data;

			if (genNodeData.content.type === "textGeneration") {
				expect(genNodeData.content.sources).toHaveLength(1);
				expect(genNodeData.content.sources[0].connectedSourceNodeId).toBe(
					textNode.id,
				);
			}
		});

		it("should remove sources from text generation nodes", async () => {
			const textNode = createTestTextNode(workflow);
			const genNode = createTestTextGenerationNode(workflow);

			genNode.addSources([textNode]);
			await workflow.save();

			let savedState = await getWorkflowFileContent(TEST_STORAGE_DIR);
			expect(savedState.connections).toHaveLength(1);

			genNode.removeSources([textNode]);
			await workflow.save();

			savedState = await getWorkflowFileContent(TEST_STORAGE_DIR);
			expect(savedState.connections).toHaveLength(0);

			const genNodeData = savedState.nodes[genNode.id].data;
			if (genNodeData.content.type === "textGeneration") {
				expect(genNodeData.content.sources).toHaveLength(0);
			}
		});
	});

	describe("Workflow Storage", () => {
		it("should save and load workflow state", async () => {
			const node1 = createTestTextGenerationNode(workflow);
			const node2 = createTestTextNode(workflow);
			node1.addSources([node2]);

			await workflow.save();
			const savedState = await getWorkflowFileContent(TEST_STORAGE_DIR);

			expect(savedState.nodes[node1.id]).toBeDefined();
			expect(savedState.nodes[node2.id]).toBeDefined();
			expect(savedState.connections).toHaveLength(1);
		});

		/** @todo pass test */
		it.todo("should load saved workflow with correct connections", async () => {
			// Create and save initial workflow state
			const sourceNode = createTestTextNode(workflow, {
				name: "Source",
				text: "Initial text",
			});
			const targetNode = createTestTextGenerationNode(workflow, {
				name: "Target",
				instruction: "Use the source",
			});
			targetNode.addSources([sourceNode]);

			await workflow.save();
			const workflowId = workflow.id;

			// Create new workflow instance and load saved state
			const newWorkflow = initWorkflow({
				storage: {
					type: "localfilesystem",
					directory: TEST_STORAGE_DIR,
				},
			});

			const loadedNodes = await newWorkflow.load(workflowId);
			const loadedTargetNode = loadedNodes[targetNode.id];

			expect(loadedTargetNode).toBeDefined();
			expect(loadedTargetNode.content.sources).toHaveLength(1);
			expect(loadedTargetNode.content.sources[0].connectedSourceNodeId).toBe(
				sourceNode.id,
			);
		});
	});

	describe("Workflow Execution", () => {
		it("should run workflow and return results", async () => {
			const sourceNode = createTestTextNode(workflow, {
				text: "Input text for generation",
			});
			const targetNode = createTestTextGenerationNode(workflow, {
				instruction: "Process the input",
			});
			targetNode.addSources([sourceNode]);

			const result = await workflow.run();

			expect(result.success).toBe(true);
			expect(result.results).toBeDefined();
			expect(result.results[targetNode.id]).toBeDefined();
			expect(result.results[targetNode.id].output).toBeTypeOf("string");
		});

		it.todo("should handle execution errors gracefully");
	});
});
