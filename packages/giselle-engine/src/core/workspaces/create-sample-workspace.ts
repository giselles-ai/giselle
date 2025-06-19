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

export async function createSampleWorkspace(args: {
	context: GiselleEngineContext;
}) {
	if (!args.context.sampleAppWorkspaceId) {
		throw new Error("sampleAppWorkspaceId is required");
	}
	const templateWorkspace = await getWorkspace({
		storage: args.context.storage,
		workspaceId: args.context.sampleAppWorkspaceId,
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
	const newWorkspace = {
		...templateWorkspace,
		id: newWorkspaceId,
		//
		// I wanted to re-assign new IDs to all copied Nodes, Inputs, Outputs, and Connections.
		// However, doing so would require updating the information embedded in the prompt,
		// which would be a bit complicated. So, for now, I'm leaving the IDs as they are.
		// Since the workspace ID is different, each element can still be uniquely identified.
		// Also, nothing is globally identified based on the node or input ID, so it shouldn't cause any problems.
		//
		// schemaVersion: templateWorkspace.schemaVersion,
		// nodes: newNodes,
		// connections: newConnections,
		// editingWorkflows: workflows,
		// ui: newUi,
	} satisfies Workspace;
	await Promise.all([
		setWorkspace({
			storage: args.context.storage,
			workspaceId: newWorkspaceId,
			workspace: newWorkspace,
		}),
		copyFiles({
			storage: args.context.storage,
			templateWorkspaceId: templateWorkspace.id,
			newWorkspaceId,
		}),
	]);
	return newWorkspace;
}
