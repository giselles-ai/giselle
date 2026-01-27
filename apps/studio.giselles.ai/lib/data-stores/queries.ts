import { desc, eq } from "drizzle-orm";
import { dataStores, db } from "@/db";

/**
 * Fetch data stores for a team.
 * NOTE: This function does not perform authorization.
 * The caller is responsible for ensuring the user has access to the team.
 */
export async function getTeamDataStores(teamDbId: number) {
	return await db
		.select({ id: dataStores.id, name: dataStores.name })
		.from(dataStores)
		.where(eq(dataStores.teamDbId, teamDbId))
		.orderBy(desc(dataStores.createdAt));
}
