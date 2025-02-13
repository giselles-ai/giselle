import { agents, db, subscriptions, teams } from "@/drizzle";
import { stripe } from "@/services/external/stripe";
import { processUnreportedActivities } from "@/services/usage-based-billing";
import { AgentTimeUsageDAO } from "@/services/usage-based-billing/agent-time-usage-dao";
import { and, eq } from "drizzle-orm";
import type { AgentId } from "../agents";

export async function reportAgentTimeUsage(agentId: AgentId, targetDate: Date) {
	const result = await db
		.select({ dbId: teams.dbId, activeSubscriptionId: subscriptions.id })
		.from(agents)
		.innerJoin(teams, eq(agents.teamDbId, teams.dbId))
		.leftJoin(
			subscriptions,
			and(
				eq(subscriptions.teamDbId, teams.dbId),
				eq(subscriptions.status, "active"),
			),
		)
		.where(eq(agents.id, agentId));
	if (result.length === 0) {
		return;
	}
	const currentTeam = result[0];

	if (currentTeam.activeSubscriptionId == null) {
		return;
	}
	return processUnreportedActivities(
		{
			teamDbId: currentTeam.dbId,
			targetDate: targetDate,
		},
		{
			dao: new AgentTimeUsageDAO(db),
			stripe: stripe,
		},
	);
}
