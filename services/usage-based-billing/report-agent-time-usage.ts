import { db } from "@/drizzle";
import { stripe } from "@/services/external/stripe";
import { fetchCurrentTeam } from "@/services/teams";
import { processUnreportedActivities } from "@/services/usage-based-billing";
import { AgentTimeUsageDAO } from "@/services/usage-based-billing/agent-time-usage-dao";

export async function reportAgentTimeUsage(targetDate: Date) {
	const currentTeam = await fetchCurrentTeam();
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
