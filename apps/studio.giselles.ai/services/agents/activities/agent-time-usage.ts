import { and, eq, gte, lt, sql } from "drizzle-orm";
import { agentActivities, agents, db, teams } from "@/db";
import { getLatestSubscriptionV2 } from "@/services/subscriptions/get-latest-subscription-v2";
import { getMonthlyBillingCycle } from "./utils";

/**
 * Calculates the total agent time usage in milliseconds for a specific team during their current billing period.
 */
export async function calculateAgentTimeUsageMs(teamDbId: number) {
	const { start, end } = await getCurrentBillingPeriod(teamDbId);
	return await agentTimeUsageMs(teamDbId, start, end);
}

/**
 * get current billing period for a team
 * - Pro Team: use active subscription's current period start and end
 * - Free Team: use team's creation date as reference date and calculate monthly billing cycle
 * @param teamDbId
 */
async function getCurrentBillingPeriod(teamDbId: number) {
	const result = await db
		.select({
			dbId: teams.dbId,
			name: teams.name,
			createdAt: teams.createdAt,
			plan: teams.plan,
			activeSubscriptionId: teams.activeSubscriptionId,
		})
		.from(teams)
		.where(eq(teams.dbId, teamDbId));
	if (result.length === 0) {
		throw new Error(`Team not found: ${teamDbId}`);
	}
	if (result.length > 1) {
		throw new Error(`Multiple teams found: ${teamDbId}`);
	}
	const data = result[0];

	// has active subscription
	if (data.activeSubscriptionId != null) {
		const result = await getLatestSubscriptionV2(data.activeSubscriptionId);
		if (!result) {
			throw new Error(`Subscription not found: ${data.activeSubscriptionId}`);
		}
		// Verify subscription is actually active to prevent using stale subscription data
		if (result.subscription.servicingStatus !== "active") {
			throw new Error(
				`Subscription is not active: ${data.activeSubscriptionId} (status: ${result.subscription.servicingStatus})`,
			);
		}
		// Calculate billing period from cadence data
		// nextBillingDate is the end of current period
		// Start is calculated by subtracting one billing cycle interval
		const nextBillingDate = result.cadence.nextBillingDate;
		const billingCycleType = result.cadence.billingCycleType;
		const intervalCount = result.cadence.billingCycleIntervalCount;

		const periodEnd = nextBillingDate;
		const periodStart = new Date(nextBillingDate);
		if (billingCycleType === "month") {
			periodStart.setMonth(periodStart.getMonth() - intervalCount);
		} else if (billingCycleType === "year") {
			periodStart.setFullYear(periodStart.getFullYear() - intervalCount);
		} else {
			throw new Error(`Unsupported billing cycle type: ${billingCycleType}`);
		}

		return {
			start: periodStart,
			end: periodEnd,
		};
	}

	// Free plan team
	const referenceDate = data.createdAt;
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
