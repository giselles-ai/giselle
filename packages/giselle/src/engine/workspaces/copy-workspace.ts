import {
	FlowTriggerId,
	generateInitialWorkspace,
	isTriggerNode,
	type TriggerNode,
	Workspace,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { getFlowTrigger, setFlowTrigger } from "../flows/utils";
import type { GiselleEngineContext } from "../types";
import { copyFiles, getWorkspace, setWorkspace } from "./utils";

export async function copyWorkspace(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	name?: string;
}) {
	const sourceWorkspace = await getWorkspace({
		useExperimentalStorage: false,
		storage: args.context.storage,
		experimental_storage: args.context.experimental_storage,
		workspaceId: args.workspaceId,
	});

	const newWorkspace = generateInitialWorkspace();

	const configuredTriggerNodes = sourceWorkspace.nodes.filter(
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
					workspaceId: newWorkspace.id,
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

	const updatedNodes = sourceWorkspace.nodes.map((node) => {
		const copy = flowTriggerCopies.find((c) => c?.oldNodeId === node.id);
		if (
			copy &&
			isTriggerNode(node) &&
			node.content.state.status === "configured"
		) {
			return {
				...node,
				content: {
					...node.content,
					state: {
						...node.content.state,
						flowTriggerId: copy.newFlowTriggerId,
					},
				},
			} satisfies TriggerNode;
		}
		return node;
	});

	const workspaceCopy: Workspace = {
		...newWorkspace,
		name: args.name ?? `Copy of ${sourceWorkspace.name ?? ""}`,
		nodes: updatedNodes,
		connections: sourceWorkspace.connections,
		ui: sourceWorkspace.ui,
	};

	await Promise.all([
		setWorkspace({
			storage: args.context.storage,
			workspaceId: workspaceCopy.id,
			workspace: Workspace.parse(workspaceCopy),
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: false,
		}),
		copyFiles({
			storage: args.context.storage,
			templateWorkspaceId: args.workspaceId,
			newWorkspaceId: workspaceCopy.id,
		}),
	]);

	return workspaceCopy;
}
