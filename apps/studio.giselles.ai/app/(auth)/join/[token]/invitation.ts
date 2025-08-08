import type { User } from "@supabase/supabase-js";
import { and, type ExtractTablesWithRelations, eq, isNull } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { VercelPgQueryResultHKT } from "drizzle-orm/vercel-postgres";
import {
	db,
	db as dbInstance,
	invitations,
	subscriptions,
	supabaseUserMappings,
	type TeamRole,
	teamMemberships,
	teams,
	users,
} from "@/drizzle";
import { getUser } from "@/lib/supabase/get-user";
import type { CurrentTeam, TeamId } from "@/services/teams";
import { handleMemberChange } from "@/services/teams/member-change";
import type * as schema from "../../../../drizzle/schema";
import { JoinError } from "./errors";

type InvitationToken = {
	token: string;
	teamId: TeamId;
	teamDbId: number;
	teamName: string;
	invitedEmail: string;
	expiredAt: Date;
	role: TeamRole;
};

export async function fetchInvitationToken(
	token: string,
	tx:
		| PgTransaction<
				VercelPgQueryResultHKT,
				typeof schema,
				ExtractTablesWithRelations<typeof schema>
		  >
		| typeof db = dbInstance,
	withLock = false,
): Promise<InvitationToken | null> {
	const baseQuery = tx
		.select({
			token: invitations.token,
			teamDbId: invitations.teamDbId,
			invitedEmail: invitations.email,
			expiredAt: invitations.expiredAt,
			revokedAt: invitations.revokedAt,
			role: invitations.role,
			teamName: teams.name,
			teamId: teams.id,
		})
		.from(invitations)
		.innerJoin(teams, eq(invitations.teamDbId, teams.dbId))
		.where(and(eq(invitations.token, token), isNull(invitations.revokedAt)))
		.limit(1);

	const query = withLock ? baseQuery.for("update") : baseQuery;

	const result = await query;
	const row = result[0];
	if (!row) {
		return null;
	}

	return {
		token: row.token,
		teamId: row.teamId as TeamId,
		teamDbId: row.teamDbId,
		teamName: row.teamName,
		invitedEmail: row.invitedEmail,
		expiredAt: row.expiredAt,
		role: row.role,
	};
}

async function fetchTeamWithSubscription(
	teamDbId: number,
): Promise<CurrentTeam | null> {
	const [team] = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			type: teams.type,
			activeSubscriptionId: subscriptions.id,
		})
		.from(teams)
		.leftJoin(
			subscriptions,
			and(
				eq(teams.dbId, subscriptions.teamDbId),
				eq(subscriptions.status, "active"),
			),
		)
		.where(eq(teams.dbId, teamDbId));

	if (!team) {
		return null;
	}

	return {
		id: team.id as TeamId,
		dbId: team.dbId,
		name: team.name,
		type: team.type,
		activeSubscriptionId: team.activeSubscriptionId,
	};
}

export async function acceptInvitation(token: string) {
	if (token.trim() === "") {
		throw new JoinError("expired");
	}

	let user: User;
	try {
		user = await getUser();
	} catch {
		throw new JoinError("wrong_email");
	}

	const invitationTeamDbId = await db.transaction(async (tx) => {
		const invitation = await fetchInvitationToken(token, tx, true);
		if (!invitation) {
			throw new JoinError("expired");
		}
		if (user.email !== invitation.invitedEmail) {
			throw new JoinError("wrong_email");
		}

		const userDb = await tx
			.select({ dbId: users.dbId })
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, user.id));
		const userDbId = userDb[0]?.dbId;
		if (!userDbId) {
			throw new JoinError("wrong_email");
		}

		await tx
			.insert(teamMemberships)
			.values({
				userDbId,
				teamDbId: invitation.teamDbId,
				role: invitation.role,
			})
			.onConflictDoNothing(); // ignore if the user is already a member of the team
		await tx
			.update(invitations)
			.set({ revokedAt: new Date() })
			.where(eq(invitations.token, token));

		return invitation.teamDbId;
	});

	// Fetch team data and handle member change for usage-based billing outside of transaction
	const teamData = await fetchTeamWithSubscription(invitationTeamDbId);
	if (teamData) {
		await handleMemberChange(teamData);
	}
}
