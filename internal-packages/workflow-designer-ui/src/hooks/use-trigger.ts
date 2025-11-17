import type { Trigger, TriggerNode } from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { useCallback } from "react";
import useSWR from "swr";

export function useTrigger(node: TriggerNode) {
	const client = useGiselle();
	const { isLoading, data, mutate } = useSWR(
		node.content.state.status === "unconfigured"
			? null
			: {
					namespace: "getTrigger",
					triggerId: node.content.state.flowTriggerId,
				},
		({ triggerId }) =>
			client.getTrigger({ triggerId }).then((res) => res.trigger),
	);

	const setTrigger = useCallback(
		(newValue: Partial<Trigger>) => {
			if (data === undefined) {
				return;
			}
			mutate(
				async () => {
					const newData = {
						...data,
						...newValue,
					} satisfies Trigger;
					await client.setTrigger({
						trigger: newData,
					});
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
	const enableTrigger = useCallback(() => {
		setTrigger({ enable: true });
	}, [setTrigger]);
	const disableTrigger = useCallback(() => {
		setTrigger({ enable: false });
	}, [setTrigger]);
	return {
		isLoading,
		data,
		enableTrigger,
		disableTrigger,
	};
}
