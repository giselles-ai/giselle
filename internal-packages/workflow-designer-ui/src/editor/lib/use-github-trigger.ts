import { useGiselleEngine } from "@giselle-ai/giselle/react";
import type {
	FlowTrigger,
	FlowTriggerId,
	GitHubFlowTrigger,
} from "@giselle-ai/protocol";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

export function useGitHubTrigger(flowTriggerId: FlowTriggerId) {
	const client = useGiselleEngine();
	const {
		isLoading: isLoadingFlowTriggerData,
		data: trigger,
		mutate,
	} = useSWR(
		{
			namespace: "getTrigger",
			flowTriggerId,
		},
		({ flowTriggerId: id }) =>
			client
				.getTrigger({
					flowTriggerId: id,
				})
				.then((res) => res.trigger),
		{
			keepPreviousData: true,
		},
	);

	const {
		isLoading: isLoadingGitHubRepositoryFullname,
		data: githubRepositoryFullnameData,
	} = useSWR(
		trigger && trigger.configuration.provider === "github"
			? {
					installationId: trigger.configuration.installationId,
					repositoryNodeId: trigger.configuration.repositoryNodeId,
				}
			: null,
		({ installationId, repositoryNodeId }) =>
			client.getGitHubRepositoryFullname({
				installationId,
				repositoryNodeId,
			}),
		{
			keepPreviousData: true,
		},
	);
	const data = useMemo(
		() =>
			trigger === undefined ||
			trigger.configuration.provider !== "github" ||
			githubRepositoryFullnameData === undefined
				? undefined
				: {
						trigger: {
							...trigger,
							configuration: {
								...trigger.configuration,
							} satisfies GitHubFlowTrigger,
						},
						githubRepositoryFullname: githubRepositoryFullnameData.fullname,
					},
		[trigger, githubRepositoryFullnameData],
	);
	const setFlowTrigger = useCallback(
		(newValue: Partial<FlowTrigger>) => {
			if (trigger === undefined) {
				return;
			}
			mutate(
				async () => {
					const newData = {
						...trigger,
						...newValue,
					} satisfies FlowTrigger;
					await client.setTrigger({
						trigger: newData,
					});
					return newData;
				},
				{
					optimisticData: () => ({
						...trigger,
						...newValue,
					}),
				},
			);
		},
		[client, mutate, trigger],
	);
	const enableFlowTrigger = useCallback(() => {
		setFlowTrigger({ enable: true });
	}, [setFlowTrigger]);
	const disableFlowTrigger = useCallback(() => {
		setFlowTrigger({ enable: false });
	}, [setFlowTrigger]);
	return {
		isLoading: isLoadingFlowTriggerData || isLoadingGitHubRepositoryFullname,
		data,
		enableFlowTrigger,
		disableFlowTrigger,
	};
}
