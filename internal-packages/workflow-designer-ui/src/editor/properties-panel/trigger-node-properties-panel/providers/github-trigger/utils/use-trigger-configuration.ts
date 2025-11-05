import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselles-ai/giselle/react";
import {
	type GitHubFlowTriggerEvent,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselles-ai/protocol";
import { findGitHubTriggerOption } from "@giselles-ai/trigger-registry";
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
			const triggerOption = findGitHubTriggerOption(event.id);
			if (triggerOption === undefined) {
				throw new Error(`Unknown trigger option for event ${event.id}`);
			}

			const outputs: Output[] = [];
			for (const item of triggerOption.payload) {
				outputs.push({
					id: OutputId.generate(),
					label: item.label,
					accessor: item.key,
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
						name: `On ${triggerOption.label}`,
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
