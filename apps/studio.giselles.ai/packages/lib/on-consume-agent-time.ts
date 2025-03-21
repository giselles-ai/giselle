import { db } from "@/drizzle";
import { saveAgentActivity } from "@/services/agents/activities";
import { reportAgentTimeUsage } from "@/services/usage-based-billing";
import type { WorkspaceId } from "@giselle-sdk/data-type";

export async function onConsumeAgentTime(
	workspaceId: WorkspaceId,
	startedAt: number,
	endedAt: number,
	totalDurationMs: number,
) {
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
	});

	if (agent == null) {
		throw new Error("Agent not found");
	}

	const agentId = agent.id;
	const startedAtDate = new Date(startedAt);
	const endedAtDate = new Date(endedAt);
	await saveAgentActivity(agentId, startedAtDate, endedAtDate, totalDurationMs);
	await reportAgentTimeUsage(agentId, endedAtDate);
}
