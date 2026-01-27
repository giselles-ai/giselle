"use server";

import { desc, eq } from "drizzle-orm";
import { dataStores, db } from "@/db";

export async function getTeamDataStores(teamDbId: number) {
	return await db
		.select({ id: dataStores.id, name: dataStores.name })
		.from(dataStores)
		.where(eq(dataStores.teamDbId, teamDbId))
		.orderBy(desc(dataStores.createdAt));
}
