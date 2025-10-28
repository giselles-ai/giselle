import {
	type Connection,
	ConnectionId,
	type Input,
	InputId,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type Output,
	OutputId,
	type Workspace,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { copyFiles, getWorkspace, setWorkspace } from "./utils";

async function createSampleWorkspaceFromTemplate(args: {
	context: GiselleEngineContext;
	templateWorkspaceId: WorkspaceId;
}) {
	const templateWorkspace = await getWorkspace({
		storage: args.context.storage,
		workspaceId: args.templateWorkspaceId,
	});
	const idMap = new Map<string, string>();
	const newNodes: NodeLike[] = [];
	for (const templateNode of templateWorkspace.nodes) {
		const newInputs: Input[] = [];
		const newOutputs: Output[] = [];
		for (const templateInput of templateNode.inputs) {
			const newId = InputId.generate();
			newInputs.push({
				...templateInput,
				id: newId,
			});
			idMap.set(templateInput.id, newId);
		}
		for (const templateOutput of templateNode.outputs) {
			const newId = OutputId.generate();
			newOutputs.push({
				...templateOutput,
				id: newId,
			});
			idMap.set(templateOutput.id, newId);
		}
		const newNodeId = NodeId.generate();
		newNodes.push({
			...templateNode,
			id: newNodeId,
			inputs: newInputs,
			outputs: newOutputs,
		});
		idMap.set(templateNode.id, newNodeId);
	}
	const newConnections: Connection[] = [];
	for (const templateConnection of templateWorkspace.connections) {
		const newInputId = idMap.get(templateConnection.inputId);
		const newOutputId = idMap.get(templateConnection.outputId);
		const newInputNodeId = idMap.get(templateConnection.inputNode.id);
		const newOutputNodeId = idMap.get(templateConnection.outputNode.id);
		if (
			newInputId === undefined ||
			newOutputId === undefined ||
			newInputNodeId === undefined ||
			newOutputNodeId === undefined
		) {
			throw new Error(`Invalid connection: ${templateConnection.id}`);
		}
		const newConnectionId = ConnectionId.generate();
		newConnections.push({
			id: newConnectionId,
			inputId: InputId.parse(newInputId),
			outputId: OutputId.parse(newOutputId),
			inputNode: {
				...templateConnection.inputNode,
				id: NodeId.parse(newInputNodeId),
			},
			outputNode: {
				...templateConnection.outputNode,
				id: NodeId.parse(newOutputNodeId),
			},
		});
	}

	const newNodeState: Record<NodeId, NodeUIState> = {};
	for (const [nodeId, nodeState] of Object.entries(
		templateWorkspace.ui.nodeState,
	)) {
		if (nodeState === undefined) {
			continue;
		}
		const newNodeId = idMap.get(nodeId);
		if (newNodeId === undefined) {
			continue;
		}
		newNodeState[NodeId.parse(newNodeId)] = nodeState;
	}
	const newWorkspaceId = WorkspaceId.generate();

	// Update prompt content with new IDs if present
	const updatedNodes = newNodes.map((node) => {
		if (
			node.type === "operation" &&
			node.content.type === "textGeneration" &&
			node.content.prompt &&
			typeof node.content.prompt === "string"
		) {
			let updatedPrompt = node.content.prompt;
			// Replace old node IDs with new ones in prompt content
			for (const [oldId, newId] of idMap.entries()) {
				updatedPrompt = updatedPrompt.replaceAll(oldId, newId);
			}
			return {
				...node,
				content: {
					...node.content,
					prompt: updatedPrompt,
				},
			};
		}
		return node;
	});

	const newWorkspace = {
		...templateWorkspace,
		id: newWorkspaceId,
		nodes: updatedNodes,
		connections: newConnections,
		ui: {
			...templateWorkspace.ui,
			nodeState: newNodeState,
		},
	} satisfies Workspace;
	await Promise.all([
		setWorkspace({
			workspaceId: newWorkspaceId,
			workspace: newWorkspace,
			storage: args.context.storage,
		}),
		copyFiles({
			storage: args.context.storage,
			templateWorkspaceId: templateWorkspace.id,
			newWorkspaceId,
		}),
	]);
	return newWorkspace;
}

export async function createSampleWorkspaces(args: {
	context: GiselleEngineContext;
}) {
	if (
		!args.context.sampleAppWorkspaceIds ||
		args.context.sampleAppWorkspaceIds.length === 0
	) {
		throw new Error(
			"sampleAppWorkspaceIds is required and must contain at least one workspace ID",
		);
	}

	const workspaces = await Promise.all(
		args.context.sampleAppWorkspaceIds.map((templateWorkspaceId) =>
			createSampleWorkspaceFromTemplate({
				context: args.context,
				templateWorkspaceId,
			}),
		),
	);

	return workspaces;
}
