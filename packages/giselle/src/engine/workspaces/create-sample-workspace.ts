import {
	type Connection,
	ConnectionId,
	FlowTriggerId,
	type Input,
	InputId,
	isTriggerNode,
	NodeId,
	type NodeLike,
	type NodeUIState,
	type Output,
	OutputId,
	type TriggerNode,
	type Workspace,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { getFlowTrigger, setFlowTrigger } from "../flows/utils";
import type { GiselleEngineContext } from "../types";
import { copyFiles, getWorkspace, setWorkspace } from "./utils";

async function createSampleWorkspaceFromTemplate(args: {
	context: GiselleEngineContext;
	templateWorkspaceId: WorkspaceId;
}) {
	const templateWorkspace = await getWorkspace({
		useExperimentalStorage: false,
		storage: args.context.storage,
		experimental_storage: args.context.experimental_storage,
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

	// Copy FlowTrigger configurations for configured trigger nodes
	const configuredTriggerNodes = newNodes.filter(
		(node): node is TriggerNode =>
			isTriggerNode(node) && node.content.state.status === "configured",
	);

	const flowTriggerCopies = await Promise.all(
		configuredTriggerNodes.map(async (node) => {
			if (node.content.state.status !== "configured") {
				return null;
			}
			const oldFlowTriggerId = node.content.state.flowTriggerId;
			const oldFlowTrigger = await getFlowTrigger({
				storage: args.context.storage,
				flowTriggerId: oldFlowTriggerId,
			});

			if (oldFlowTrigger) {
				const newFlowTriggerId = FlowTriggerId.generate();
				const newFlowTrigger = {
					...oldFlowTrigger,
					id: newFlowTriggerId,
					workspaceId: newWorkspaceId,
					nodeId: node.id,
				};

				await setFlowTrigger({
					storage: args.context.storage,
					flowTrigger: newFlowTrigger,
				});

				return { oldNodeId: node.id, newFlowTriggerId };
			}
			return null;
		}),
	);

	// Update prompt content with new IDs and trigger node FlowTrigger IDs
	const updatedNodes = newNodes.map((node) => {
		// Update trigger nodes with new FlowTrigger IDs
		const triggerCopy = flowTriggerCopies.find((c) => c?.oldNodeId === node.id);
		if (
			triggerCopy &&
			isTriggerNode(node) &&
			node.content.state.status === "configured"
		) {
			return {
				...node,
				content: {
					...node.content,
					state: {
						...node.content.state,
						flowTriggerId: triggerCopy.newFlowTriggerId,
					},
				},
			} satisfies TriggerNode;
		}

		// Update text generation nodes with new IDs in prompts
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
			storage: args.context.storage,
			workspaceId: newWorkspaceId,
			workspace: newWorkspace,
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: false,
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
