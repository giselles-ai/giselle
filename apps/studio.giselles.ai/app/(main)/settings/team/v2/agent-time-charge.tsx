import { calculateAgentTimeUsageMs } from "@/services/agents/activities";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import {
	AgentTimeUsageForFreePlan,
	AgentTimeUsageForProPlan,
} from "../components/v2/agent-time-usage";

export async function AgentTimeCharge() {
	const currentTeam = await fetchCurrentTeam();
	const currentTeamIsPro = isProPlan(currentTeam);
	const timeChargeMs = await calculateAgentTimeUsageMs(currentTeam.dbId);
	// Round to 2 decimal places for display
	const usedMinutes = Math.ceil((timeChargeMs / 1000 / 60) * 100) / 100;

	return (
		<div className="bg-transparent rounded-[8px] border-[0.5px] border-black-400 px-[24px] pt-[16px] pb-[24px] w-full gap-[24px] grid">
			{currentTeamIsPro ? (
				<AgentTimeUsageForProPlan usedMinutes={usedMinutes} />
			) : (
				<AgentTimeUsageForFreePlan usedMinutes={usedMinutes} />
			)}
		</div>
	);
}
