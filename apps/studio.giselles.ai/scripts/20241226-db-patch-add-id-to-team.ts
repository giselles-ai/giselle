import { eq } from "drizzle-orm";
import { db, teams } from "@/drizzle";
import { createTeamId } from "@/services/teams/utils";

const teamsWillNulId = await db.query.teams.findMany({
	where: (teams, { isNull }) => isNull(teams.id),
});

await Promise.all(
	teamsWillNulId.map(async (team) => {
		await db
			.update(teams)
			.set({ id: createTeamId() })
			.where(eq(teams.dbId, team.dbId));
	}),
);

console.log("Successfully updated all teams with null id");
