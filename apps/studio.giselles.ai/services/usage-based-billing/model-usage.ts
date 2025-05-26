import { db, modelUsage, modelUsageItems } from "@/drizzle";
import type { UsageItem, WorkspaceId } from "@giselle-sdk/data-type";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, lt } from "drizzle-orm";
import { fetchAgentFromWorkspaceId } from "../agents";
import { fetchCurrentTeam } from "../teams";

const MODEL_USAGE_METER_NAME = "model_usage";

/**
 * Saves model usage for later billing purposes.
 */
export async function onUsageResolved({
	workspaceId,
	model,
	provider,
	endedAt,
	usageItems,
}: {
	workspaceId: WorkspaceId;
	model: string;
	provider: string;
	endedAt: Date;
	usageItems: UsageItem[];
}): Promise<void> {
	const team = await fetchCurrentTeam();
	const agent = await fetchAgentFromWorkspaceId(workspaceId);

	await db.transaction(async (tx) => {
		// Create the main model usage record
		const modelUsageRecord = await tx
			.insert(modelUsage)
			.values({
				teamDbId: team.dbId,
				agentDbId: agent.dbId,
				model,
				provider,
				createdAt: new Date(),
			})
			.returning();

		// Create usage metric items
		await Promise.all(
			usageItems.map((item) =>
				tx.insert(modelUsageItems).values({
					modelUsageDbId: modelUsageRecord[0].dbId,
					usageMetric: item.metric,
					amount: item.amount,
					unit: item.unit,
					endedAt,
					createdAt: new Date(),
				}),
			),
		);
	});
}
