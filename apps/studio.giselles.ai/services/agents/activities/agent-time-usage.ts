import { and, eq, gte, lt, sql } from "drizzle-orm";
import { agentActivities, agents, db, teams } from "@/db";
import { getMonthlyBillingCycle } from "./utils";

/**
 * Calculates the total agent time usage in milliseconds for a specific team during their current billing period.
 */
export async function calculateAgentTimeUsageMs(teamDbId: number) {
	const { start, end } = await getCurrentBillingPeriod(teamDbId);
	return await agentTimeUsageMs(teamDbId, start, end);
}

/**
 * Get current billing period for a team.
 * Uses team's creation date as reference date and calculates monthly billing cycle.
 */
async function getCurrentBillingPeriod(teamDbId: number) {
	const result = await db
		.select({
			createdAt: teams.createdAt,
		})
		.from(teams)
		.where(eq(teams.dbId, teamDbId));
	if (result.length === 0) {
		throw new Error(`Team not found: ${teamDbId}`);
	}

	const referenceDate = result[0].createdAt;
	const currentDate = new Date();
	return getMonthlyBillingCycle(referenceDate, currentDate);
}

// Caluclate the time usage of an agent specified by the time range
async function agentTimeUsageMs(
	teamDbId: number,
	startedAt: Date,
	endedAt: Date,
) {
	const result = await db
		.select({
			value: sql<number>`sum(${agentActivities.totalDurationMs})`,
		})
		.from(agentActivities)
		.innerJoin(agents, eq(agents.dbId, agentActivities.agentDbId))
		.where(
			and(
				eq(agents.teamDbId, teamDbId),
				// half-open interval [startedAt, endedAt)
				and(
					gte(agentActivities.endedAt, startedAt),
					lt(agentActivities.endedAt, endedAt),
				),
			),
		);
	if (result.length === 0) {
		return 0;
	}
	return result[0].value;
}
