import type { UsageLimits } from "@giselle-sdk/giselle-engine";
import { Tier } from "@giselle-sdk/language-model";
import { eq } from "drizzle-orm";
import { agentTimeRestrictions, db, teams } from "@/drizzle";
import {
	AGENT_TIME_CHARGE_LIMIT_MINUTES,
	calculateAgentTimeUsageMs,
} from "../../services/agents/activities";
import { type CurrentTeam, isProPlan, type TeamId } from "../../services/teams";

export async function getUsageLimitsForTeam(
	team: CurrentTeam,
): Promise<UsageLimits> {
	const featureTier = isProPlan(team) ? Tier.enum.pro : Tier.enum.free;
	const agentTimeUsage = await calculateAgentTimeUsageMs(team.dbId);
	const restricted = await fetchAgentTimeRestrictedTeamIds();
	const agentTimeLimitValue = agentTimeLimit(team, restricted);

	return {
		featureTier,
		resourceLimits: {
			agentTime: {
				limit: agentTimeLimitValue,
				used: agentTimeUsage,
			},
		},
	};
}

function agentTimeLimit(team: CurrentTeam, restricted: TeamId[]): number {
	if (restricted.includes(team.id)) {
		return 0; // restricted teams should not be able to use agent time
	}

	if (isProPlan(team)) {
		return Number.POSITIVE_INFINITY; // pro plan has no limit
	}

	return AGENT_TIME_CHARGE_LIMIT_MINUTES.FREE * 60 * 1000;
}

async function fetchAgentTimeRestrictedTeamIds(): Promise<TeamId[]> {
	const restrictedTeams = await db
		.select({
			id: teams.id,
		})
		.from(agentTimeRestrictions)
		.innerJoin(teams, eq(teams.dbId, agentTimeRestrictions.teamDbId));

	return restrictedTeams.map((team) => team.id);
}
