import {
	type GitHubEventData,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselles-ai/protocol";
import { useGiselle, useWorkflowDesigner } from "@giselles-ai/react";
import {
	githubEvents,
	githubEventToInputFields,
} from "@giselles-ai/trigger-registry";
import { useCallback, useTransition } from "react";
import type {
	InputCallsignStep,
	InputLabelsStep,
} from "../github-trigger-properties-panel";

interface UseTriggerConfigurationReturn {
	configureTrigger: (
		event: GitHubEventData,
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
	const client = useGiselle();
	const [isPending, startTransition] = useTransition();

	const configureTrigger = useCallback(
		(event: GitHubEventData, step: InputCallsignStep | InputLabelsStep) => {
			const githubEvent = githubEvents[event.id];

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

					const outputs: Output[] = githubEventToInputFields(githubEvent).map(
						(inputField) => ({
							id: OutputId.generate(),
							label: inputField.label,
							accessor: inputField.key,
						}),
					);

					updateNodeData(node, {
						content: {
							...node.content,
							state: {
								status: "configured",
								flowTriggerId: triggerId,
							},
						},
						outputs: [...node.outputs, ...outputs],
						name: `On ${githubEvent.label}`,
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
