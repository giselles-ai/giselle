import {
	generateInitialWorkspace,
	isTriggerNode,
	TriggerId,
	type TriggerNode,
	Workspace,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import { getTrigger, setTrigger } from "../triggers/utils";
import type { GiselleContext } from "../types";
import { copyFiles, getWorkspace, setWorkspace } from "./utils";

export async function copyWorkspace(args: {
	context: GiselleContext;
	workspaceId: WorkspaceId;
	name?: string;
}) {
	const sourceWorkspace = await getWorkspace({
		storage: args.context.storage,
		workspaceId: args.workspaceId,
	});

	const newWorkspace = generateInitialWorkspace();

	const configuredTriggerNodes = sourceWorkspace.nodes.filter(
		(node): node is TriggerNode =>
			isTriggerNode(node) && node.content.state.status === "configured",
	);

	const triggerCopies = await Promise.all(
		configuredTriggerNodes.map(async (node) => {
			if (node.content.state.status !== "configured") {
				return null;
			}
			const oldTriggerId = node.content.state.flowTriggerId;
			const oldTrigger = await getTrigger({
				storage: args.context.storage,
				triggerId: oldTriggerId,
			});

			if (oldTrigger) {
				const newTriggerId = TriggerId.generate();
				const newTrigger = {
					...oldTrigger,
					id: newTriggerId,
					workspaceId: newWorkspace.id,
					nodeId: node.id,
				};

				await setTrigger({
					storage: args.context.storage,
					trigger: newTrigger,
				});

				return { oldNodeId: node.id, newTriggerId };
			}
			return null;
		}),
	);

	const updatedNodes = sourceWorkspace.nodes.map((node) => {
		const copy = triggerCopies.find((c) => c?.oldNodeId === node.id);
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
						flowTriggerId: copy.newTriggerId,
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
			workspaceId: workspaceCopy.id,
			workspace: Workspace.parse(workspaceCopy),
			storage: args.context.storage,
		}),
		copyFiles({
			storage: args.context.storage,
			templateWorkspaceId: args.workspaceId,
			newWorkspaceId: workspaceCopy.id,
		}),
	]);

	return workspaceCopy;
}
