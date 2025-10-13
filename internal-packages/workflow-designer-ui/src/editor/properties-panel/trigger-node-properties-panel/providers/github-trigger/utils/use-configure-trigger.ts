import type {
	FlowTriggerId,
	GitHubFlowTriggerEvent,
	TriggerNode,
} from "@giselle-sdk/data-type";
import { githubTriggers } from "@giselle-sdk/flow";
import {
	useFeatureFlag,
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { useCallback, useTransition } from "react";
import type { RepositoryInfo } from "./resolve-next-step";
import { generateTriggerOutputs } from "./trigger-configuration";

interface UseConfigureTriggerReturn {
	configureTrigger: ({
		event,
		repositoryInfo,
		flowTriggerId,
	}: {
		event: GitHubFlowTriggerEvent;
		repositoryInfo: RepositoryInfo;
		flowTriggerId?: FlowTriggerId;
	}) => void;
	isPending: boolean;
}

/**
 * Hook for executing GitHub trigger setup operations
 * Handles both initial configuration and reconfiguration
 */
export const useConfigureTrigger = ({
	node,
}: {
	node: TriggerNode;
}): UseConfigureTriggerReturn => {
	const { experimental_storage } = useFeatureFlag();
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();

	const configureTrigger = useCallback(
		({
			event,
			repositoryInfo,
			flowTriggerId,
		}: {
			event: GitHubFlowTriggerEvent;
			repositoryInfo: RepositoryInfo;
			flowTriggerId?: FlowTriggerId;
		}) => {
			const trigger = githubTriggers[event.id];
			startTransition(async () => {
				try {
					let triggerId: FlowTriggerId;

					if (
						flowTriggerId !== undefined &&
						node.content.state.status === "reconfiguring"
					) {
						const result = await client.reconfigureGitHubTrigger({
							flowTriggerId,
							repositoryNodeId: repositoryInfo.repoNodeId,
							installationId: repositoryInfo.installationId,
							useExperimentalStorage: experimental_storage,
							event,
						});
						triggerId = result.triggerId;
					} else {
						const result = await client.configureTrigger({
							trigger: {
								nodeId: node.id,
								workspaceId: workspace.id,
								enable: false,
								configuration: {
									provider: "github",
									repositoryNodeId: repositoryInfo.repoNodeId,
									installationId: repositoryInfo.installationId,
									event,
								},
							},
							useExperimentalStorage: experimental_storage,
						});
						triggerId = result.triggerId;
					}

					updateNodeData(node, {
						content: {
							...node.content,
							state: {
								status: "configured",
								flowTriggerId: triggerId,
							},
						},
						outputs:
							node.outputs.length > 0
								? node.outputs
								: generateTriggerOutputs(event.id),
						name:
							node.content.state.status === "reconfiguring"
								? node.name
								: `On ${trigger.event.label}`,
					});
				} catch (_error) {
					// Error is handled by the UI state
				}
			});
		},
		[workspace.id, client, node, updateNodeData, experimental_storage],
	);

	return { configureTrigger, isPending };
};
