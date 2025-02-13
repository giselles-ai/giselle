"use server";

import { agents, db, supabaseUserMappings, teamMemberships } from "@/drizzle";
import { getUser } from "@/lib/supabase";
import type { AgentId } from "@/services/agents";
import { and, eq } from "drizzle-orm";

export const getTeamMembershipByAgentId = async (
	agentId: AgentId,
	userId: string,
) => {
	const [teamMembership] = await db
		.select({ id: teamMemberships.id })
		.from(teamMemberships)
		.innerJoin(
			supabaseUserMappings,
			eq(supabaseUserMappings.supabaseUserId, userId),
		)
		.innerJoin(agents, eq(agents.id, agentId))
		.where(
			and(
				eq(teamMemberships.teamDbId, agents.teamDbId),
				eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
			),
		);

	if (!teamMembership) {
		return null;
	}

	return teamMembership;
};
