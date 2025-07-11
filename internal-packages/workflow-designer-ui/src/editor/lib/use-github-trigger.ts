import type {
	FlowTrigger,
	FlowTriggerId,
	GitHubFlowTrigger,
} from "@giselle-sdk/data-type";
import { useGiselleEngine } from "@giselle-sdk/giselle-engine/react";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

export function useGitHubTrigger(flowTriggerId: FlowTriggerId) {
	const client = useGiselleEngine();
	const {
		isLoading: isLoadingFlowTriggerData,
		data: trigger,
		mutate,
		error: triggerError,
	} = useSWR(
		`/triggers/${flowTriggerId}`,
		async () => {
			try {
				const res = await client.getTrigger({ flowTriggerId });
				return res.trigger;
			} catch (error) {
				console.error("Failed to get trigger:", error);
				throw error;
			}
		},
		{ revalidateOnFocus: false, shouldRetryOnError: true },
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
		async (newValue: Partial<FlowTrigger>) => {
			if (trigger === undefined) {
				throw new Error("Cannot update trigger: trigger is undefined");
			}
			try {
				return await mutate(
					async () => {
						const newData = {
							...trigger,
							...newValue,
						} satisfies FlowTrigger;
						await client.setTrigger({ trigger: newData });
						return newData;
					},
					{
						optimisticData: () => ({
							...trigger,
							...newValue,
						}),
						revalidate: true,
						populateCache: true,
						throwOnError: true,
					},
				);
			} catch (error) {
				console.error("Failed to set flow trigger:", error);
				throw error;
			}
		},
		[client, mutate, trigger],
	);
	const enableFlowTrigger = useCallback(async () => {
		try {
			return await setFlowTrigger({ enable: true });
		} catch (error) {
			console.error("Failed to enable flow trigger:", error);
			throw error;
		}
	}, [setFlowTrigger]);

	const disableFlowTrigger = useCallback(async () => {
		try {
			return await setFlowTrigger({ enable: false });
		} catch (error) {
			console.error("Failed to disable flow trigger:", error);
			throw error;
		}
	}, [setFlowTrigger]);
	return {
		isLoading: isLoadingFlowTriggerData || isLoadingGitHubRepositoryFullname,
		data,
		error: triggerError,
		enableFlowTrigger,
		disableFlowTrigger,
	};
}
