import { eq } from "drizzle-orm";
import { agentActivities, agents, db } from "@/drizzle";
import type { AgentId } from "@/services/agents";

export async function saveAgentActivity(
	agentId: AgentId,
	startedAt: Date,
	endedAt: Date,
	totalDurationMs: number,
) {
	const records = await db
		.select({ agentDbId: agents.dbId })
		.from(agents)
		.where(eq(agents.id, agentId));
	if (records.length === 0) {
		throw new Error(`Agent with id ${agentId} not found`);
	}
	const agentDbId = records[0].agentDbId;

	await db.insert(agentActivities).values({
		agentDbId,
		startedAt: startedAt,
		endedAt: endedAt,
		totalDurationMs: totalDurationMs.toString(),
	});
}
