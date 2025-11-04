import {
	type GitHubFlowTriggerEvent,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselle-ai/data-type";
import { getGitHubDisplayLabel, githubTriggers } from "@giselle-ai/flow";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-ai/giselle/react";
import { useCallback, useTransition } from "react";
import type {
	InputCallsignStep,
	InputLabelsStep,
} from "../github-trigger-properties-panel";

interface UseTriggerConfigurationReturn {
	configureTrigger: (
		event: GitHubFlowTriggerEvent,
		step: InputCallsignStep | InputLabelsStep,
	) => void;
	isPending: boolean;
}

export const useTriggerConfiguration = ({
	node,
}: {
	node: TriggerNode;
}): UseTriggerConfigurationReturn => {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();

	const configureTrigger = useCallback(
		(
			event: GitHubFlowTriggerEvent,
			step: InputCallsignStep | InputLabelsStep,
		) => {
			const trigger = githubTriggers[event.id];

			const outputs: Output[] = [];
			for (const key of trigger.event.payloads.keyof().options) {
				outputs.push({
					id: OutputId.generate(),
					label: getGitHubDisplayLabel({
						eventId: event.id,
						accessor: key,
					}),
					accessor: key,
				});
			}

			startTransition(async () => {
				try {
					const { triggerId } = await client.configureTrigger({
						trigger: {
							nodeId: node.id,
							workspaceId: workspace.id,
							enable: false,
							configuration: {
								provider: "github",
								repositoryNodeId: step.repoNodeId,
								installationId: step.installationId,
								event,
							},
						},
					});

					updateNodeData(node, {
						content: {
							...node.content,
							state: {
								status: "configured",
								flowTriggerId: triggerId,
							},
						},
						outputs: [...node.outputs, ...outputs],
						name: `On ${trigger.event.label}`,
					});
				} catch (_error) {
					// Error is handled by the UI state
				}
			});
		},
		[workspace.id, client, node, updateNodeData],
	);

	return { configureTrigger, isPending };
};
