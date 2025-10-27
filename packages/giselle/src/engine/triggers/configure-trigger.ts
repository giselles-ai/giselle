import {
	FlowTrigger,
	FlowTriggerId,
	isTriggerNode,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import type { z } from "zod/v4";
import { addGitHubRepositoryIntegrationIndex } from "../integrations/utils";
import type { GiselleEngineContext } from "../types";
import { getWorkspace, setWorkspace } from "../workspaces/utils";
import { setFlowTrigger } from "./utils";

export const ConfigureTriggerInput = FlowTrigger.omit({ id: true });
export type ConfigureTriggerInput = z.infer<typeof ConfigureTriggerInput>;

export async function configureTrigger(args: {
	context: GiselleEngineContext;
	trigger: ConfigureTriggerInput;
	useExperimentalStorage: boolean;
}) {
	const flowTriggerId = FlowTriggerId.generate();
	const [workspace] = await Promise.all([
		getWorkspace({
			deprecated_storage: args.context.deprecated_storage,
			storage: args.context.storage,
			workspaceId: args.trigger.workspaceId,
			useExperimentalStorage: args.useExperimentalStorage,
		}),
		setFlowTrigger({
			deprecated_storage: args.context.deprecated_storage,
			storage: args.context.storage,
			flowTrigger: {
				id: flowTriggerId,
				...args.trigger,
			},
			useExperimentalStorage: args.useExperimentalStorage,
		}),
		args.trigger.configuration.provider === "github"
			? await addGitHubRepositoryIntegrationIndex({
					deprecated_storage: args.context.deprecated_storage,
					storage: args.context.storage,
					flowTriggerId,
					repositoryNodeId: args.trigger.configuration.repositoryNodeId,
					useExperimentalStorage: args.useExperimentalStorage,
				})
			: Promise.resolve(),
	]);
	await setWorkspace({
		deprecated_storage: args.context.deprecated_storage,
		workspaceId: workspace.id,
		workspace: {
			...workspace,
			nodes: workspace.nodes.map((node) =>
				node.id === args.trigger.nodeId && isTriggerNode(node)
					? ({
							...node,
							content: {
								...node.content,
								state: {
									status: "configured",
									flowTriggerId: flowTriggerId,
								},
							},
						} satisfies TriggerNode)
					: node,
			),
		},
		storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage,
	});
	return flowTriggerId;
}
