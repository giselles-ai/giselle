import { db, modelUsage, modelUsageItems } from "@/drizzle";
import type { UsageMetric, UsageUnit } from "@giselle-sdk/data-type";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, lt } from "drizzle-orm";

const MODEL_USAGE_METER_NAME = "model_usage";

type ModelUsageParams = {
	teamDbId: number;
	agentDbId: number;
	model: string;
	provider: string;
	endedAt: Date;
	usageItem: {
		metric: UsageMetric;
		amount: number;
		unit: UsageUnit;
	};
};

/**
 * Saves model usage for later billing purposes.
 *
 * @param params - Model usage parameters
 * @returns {Promise<void>} A promise that resolves when the usage has been saved
 */
export async function saveModelUsage(params: ModelUsageParams): Promise<void> {
	await db.transaction(async (tx) => {
		// Create the main model usage record
		const modelUsageRecord = await tx
			.insert(modelUsage)
			.values({
				teamDbId: params.teamDbId,
				agentDbId: params.agentDbId,
				model: params.model,
				provider: params.provider,
				createdAt: new Date(),
			})
			.returning();

		// Create usage metric item
		await tx.insert(modelUsageItems).values({
			modelUsageDbId: modelUsageRecord[0].dbId,
			usageMetric: params.usageItem.metric,
			amount: params.usageItem.amount,
			unit: params.usageItem.unit,
			endedAt: params.endedAt,
			createdAt: new Date(),
		});
	});
}
