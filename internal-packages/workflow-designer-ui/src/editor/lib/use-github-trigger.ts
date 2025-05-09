import type { FlowTriggerId } from "@giselle-sdk/data-type";
import { useGiselleEngine } from "giselle-sdk/react";
import { useMemo } from "react";
import useSWR from "swr";

export function useGitHubTrigger(flowTriggerId: FlowTriggerId) {
	const client = useGiselleEngine();
	const { isLoading: isLoadingFlowTriggerData, data: flowTriggerData } = useSWR(
		[`/triggers/${flowTriggerId}`, flowTriggerId],
		([_, flowTriggerId]) => client.getTrigger({ flowTriggerId }),
	);
	const {
		isLoading: isLoadingGitHubRepositoryFullname,
		data: githubRepositoryFullnameData,
	} = useSWR(
		flowTriggerData &&
			flowTriggerData.flowTrigger.configuration.provider === "github"
			? [
					`/github/repositories/${flowTriggerData.flowTrigger.configuration.repositoryNodeId}`,
					flowTriggerData.flowTrigger,
				]
			: null,
		([_, flowTrigger]) =>
			client.getGitHubRepositoryFullname({
				installationId: flowTrigger.configuration.installationId,
				repositoryNodeId: flowTrigger.configuration.repositoryNodeId,
			}),
	);
	const data = useMemo(
		() =>
			flowTriggerData === undefined ||
			githubRepositoryFullnameData === undefined
				? undefined
				: {
						flowTrigger: flowTriggerData?.flowTrigger,
						githubRepositoryFullname: githubRepositoryFullnameData.fullname,
					},
		[flowTriggerData, githubRepositoryFullnameData],
	);
	return {
		isLoading: isLoadingFlowTriggerData || isLoadingGitHubRepositoryFullname,
		data,
	};
}
