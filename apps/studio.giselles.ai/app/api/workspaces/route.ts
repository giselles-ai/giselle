import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { agents, db, workspaces } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { giselleEngine } from "../../giselle-engine";

export async function POST(_request: Request) {
	const agentId = `agnt_${createId()}` as const;
	const user = await fetchCurrentUser();
	const team = await fetchCurrentTeam();

	const workspace = await giselleEngine.createWorkspace();

	// The agents table is deprecated, so we are inserting into the workspaces table.
	await db.insert(agents).values({
		id: agentId,
		teamDbId: team.dbId,
		creatorDbId: user.dbId,
		workspaceId: workspace.id,
	});
	await db.insert(workspaces).values({
		id: workspace.id,
		creatorDbId: user.dbId,
		teamDbId: team.dbId,
	});

	const redirectPath = `/workspaces/${workspace.id}`;
	return NextResponse.json({ redirectPath }, { status: 201 });
}
