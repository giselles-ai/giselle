import {
	FlowTriggerId,
	generateInitialWorkspace,
	isTriggerNode,
	type TriggerNode,
	Workspace,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { getFlowTrigger, setFlowTrigger } from "../triggers/utils";
import type { GiselleEngineContext } from "../types";
import { copyFiles, getWorkspace, setWorkspace } from "./utils";

export async function copyWorkspace(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	name?: string;
	useExperimentalStorage: boolean;
}) {
	const sourceWorkspace = await getWorkspace({
		useExperimentalStorage: args.useExperimentalStorage,
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.storage,
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
				storage: args.context.deprecated_storage,
				experimental_storage: args.context.storage,
				flowTriggerId: oldFlowTriggerId,
				useExperimentalStorage: args.useExperimentalStorage,
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
					storage: args.context.deprecated_storage,
					experimental_storage: args.context.storage,
					flowTrigger: newFlowTrigger,
					useExperimentalStorage: args.useExperimentalStorage,
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
			storage: args.context.deprecated_storage,
			workspaceId: workspaceCopy.id,
			workspace: Workspace.parse(workspaceCopy),
			experimental_storage: args.context.storage,
			useExperimentalStorage: args.useExperimentalStorage,
		}),
		copyFiles({
			storage: args.context.deprecated_storage,
			experimental_storage: args.context.storage,
			templateWorkspaceId: args.workspaceId,
			newWorkspaceId: workspaceCopy.id,
			useExperimentalStorage: args.useExperimentalStorage,
		}),
	]);

	return workspaceCopy;
}
