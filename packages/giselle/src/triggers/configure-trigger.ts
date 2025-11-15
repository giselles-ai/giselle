import {
	isTriggerNode,
	Trigger,
	TriggerId,
	type TriggerNode,
} from "@giselles-ai/protocol";
import type * as z from "zod/v4";
import { addGitHubRepositoryIntegrationIndex } from "../integrations/utils";
import type { GiselleContext } from "../types";
import { getWorkspace, setWorkspace } from "../workspaces/utils";
import { setTrigger } from "./utils";

export const ConfigureTriggerInput = Trigger.omit({ id: true });
export type ConfigureTriggerInput = z.infer<typeof ConfigureTriggerInput>;

export async function configureTrigger(args: {
	context: GiselleContext;
	trigger: ConfigureTriggerInput;
}) {
	const triggerId = TriggerId.generate();
	const [workspace] = await Promise.all([
		getWorkspace({
			storage: args.context.storage,
			workspaceId: args.trigger.workspaceId,
		}),
		setTrigger({
			storage: args.context.storage,
			trigger: {
				id: triggerId,
				...args.trigger,
			},
		}),
		args.trigger.configuration.provider === "github"
			? await addGitHubRepositoryIntegrationIndex({
					storage: args.context.storage,
					triggerId: triggerId,
					repositoryNodeId: args.trigger.configuration.repositoryNodeId,
				})
			: Promise.resolve(),
	]);
	await setWorkspace({
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
									flowTriggerId: triggerId,
								},
							},
						} satisfies TriggerNode)
					: node,
			),
		},
		storage: args.context.storage,
	});
	return triggerId;
}
