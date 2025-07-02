import type { FlowTrigger, TriggerNode } from "@giselle-sdk/data-type";
import { useGiselleEngine } from "@giselle-sdk/giselle-engine/react";
import { useCallback } from "react";
import useSWR from "swr";

export function useTrigger(node: TriggerNode) {
	const client = useGiselleEngine();
	const { isLoading, data, mutate } = useSWR(
		node.content.state.status === "unconfigured"
			? null
			: {
					namespace: "getTrigger",
					flowTriggerId: node.content.state.flowTriggerId,
				},
		({ flowTriggerId }) =>
			client.getTrigger({ flowTriggerId }).then((res) => res.trigger),
	);

	const setFlowTrigger = useCallback(
		(newValue: Partial<FlowTrigger>) => {
			if (data === undefined) {
				return;
			}
			mutate(
				async () => {
					const newData = {
						...data,
						...newValue,
					} satisfies FlowTrigger;
					await client.setTrigger({ trigger: newData });
					return newData;
				},
				{
					optimisticData: () => ({
						...data,
						...newValue,
					}),
				},
			);
		},
		[client, mutate, data],
	);
	const enableFlowTrigger = useCallback(async () => {
		await setFlowTrigger({ enable: true });
	}, [setFlowTrigger]);
	const disableFlowTrigger = useCallback(async () => {
		await setFlowTrigger({ enable: false });
	}, [setFlowTrigger]);
	return {
		isLoading,
		data,
		enableFlowTrigger,
		disableFlowTrigger,
	};
}
