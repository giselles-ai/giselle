import { agents, db } from "@/drizzle";
import { eq } from "drizzle-orm";

const listOfAgents = await db.select().from(agents);
for (const agent of listOfAgents) {
	await db
		.update(agents)
		.set({
			graphv2: {
				...agent.graphv2,
				webSearches: [],
			},
		})
		.where(eq(agents.id, agent.id));
}
