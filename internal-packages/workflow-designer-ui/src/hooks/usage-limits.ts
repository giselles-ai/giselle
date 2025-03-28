import { useUsageLimits } from "giselle-sdk/react";
import { useMemo } from "react";

export function useUsageLimitsReached() {
	const usageLimits = useUsageLimits();
	return useMemo(() => {
		if (usageLimits === undefined) {
			return false;
		}
		const agentTimeLimits = usageLimits.resourceLimits.agentTime;
		return agentTimeLimits.used >= agentTimeLimits.limit;
	}, [usageLimits]);
}
