import type { UsageLimits } from "@giselle-sdk/usage-limits";
import { Tier } from "giselle-sdk";
import {
	AGENT_TIME_CHARGE_LIMIT_MINUTES,
	calculateAgentTimeUsageMs,
} from "../../services/agents/activities";
import { type CurrentTeam, isProPlan } from "../../services/teams";

export async function getUsageLimitsForTeam(
	team: CurrentTeam,
): Promise<UsageLimits> {
	const featureTier = isProPlan(team) ? Tier.enum.pro : Tier.enum.free;

	const agentTimeUsage = await calculateAgentTimeUsageMs(team.dbId);
	const agentTimeLimit = isProPlan(team)
		? Number.POSITIVE_INFINITY // pro plan has no limit
		: AGENT_TIME_CHARGE_LIMIT_MINUTES.FREE * 60 * 1000;

	return {
		featureTier,
		resourceLimits: {
			agentTime: {
				limit: agentTimeLimit,
				used: agentTimeUsage,
			},
		},
	};
}
