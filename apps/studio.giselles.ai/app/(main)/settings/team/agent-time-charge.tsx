import { Card } from "@/components/ui/card";
import { calculateAgentTimeUsageMs } from "@/services/agents/activities";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import {
	AgentTimeUsageForFreePlan,
	AgentTimeUsageForProPlan,
} from "./components/agent-time-usage";

export async function AgentTimeCharge() {
	const currentTeam = await fetchCurrentTeam();
	const currentTeamIsPro = isProPlan(currentTeam);
	const timeChargeMs = await calculateAgentTimeUsageMs(currentTeam.dbId);
	// Round to 2 decimal places for display
	const usedMinutes = Math.ceil((timeChargeMs / 1000 / 60) * 100) / 100;

	return (
		<Card title="App Usage Time">
			{currentTeamIsPro ? (
				<AgentTimeUsageForProPlan usedMinutes={usedMinutes} />
			) : (
				<AgentTimeUsageForFreePlan usedMinutes={usedMinutes} />
			)}
		</Card>
	);
}
