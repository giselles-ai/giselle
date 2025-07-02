import { and, eq, isNull, sql } from "drizzle-orm";
import type { TeamRole, UserId } from "@/drizzle";
import { db } from "@/drizzle";
import { invitations, teamMemberships, teams, users } from "@/drizzle/schema";
import { sendEmail } from "@/services/external/email";
import { type CurrentTeam, fetchCurrentTeam } from "@/services/teams";

export type Invitation = typeof invitations.$inferSelect;

export function createInvitation(
	email: string,
	role: TeamRole,
	currentTeam: CurrentTeam,
	currentUser: {
		dbId: number;
		id: UserId;
	},
): Promise<Invitation> {
	const normalizedEmail = email.trim().toLowerCase();
	const token = crypto.randomUUID();
	const expiredAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

	return db.transaction(async (tx) => {
		// acquire advisory lock
		await tx.execute(sql`
        SELECT pg_advisory_xact_lock(
          ${currentTeam.dbId},
          hashtext(${normalizedEmail})
        )
      `);

		// block invite if the user is already a team member
		const existingMember = await tx
			.select({ userDbId: users.dbId })
			.from(users)
			.innerJoin(
				teamMemberships,
				and(
					eq(teamMemberships.userDbId, users.dbId),
					eq(teamMemberships.teamDbId, currentTeam.dbId),
				),
			)
			.where(eq(users.email, normalizedEmail))
			.limit(1);

		if (existingMember.length > 0) {
			throw new Error("User is already a member of this team");
		}

		// block invite if an active invitation already exists
		const existingActiveInvitation = await tx
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.teamDbId, currentTeam.dbId),
					eq(invitations.email, normalizedEmail),
					isNull(invitations.revokedAt),
					sql`${invitations.expiredAt} > now()`, // not expired
				),
			)
			.limit(1);

		if (existingActiveInvitation.length > 0) {
			throw new Error("An active invitation already exists");
		}

		// insert the invitation
		const result = await tx
			.insert(invitations)
			.values({
				token,
				teamDbId: currentTeam.dbId,
				email: normalizedEmail,
				role,
				inviterUserDbId: currentUser.dbId,
				expiredAt,
				revokedAt: null,
			})
			.returning({
				token: invitations.token,
				teamDbId: invitations.teamDbId,
				email: invitations.email,
				role: invitations.role,
				inviterUserDbId: invitations.inviterUserDbId,
				expiredAt: invitations.expiredAt,
				createdAt: invitations.createdAt,
				revokedAt: invitations.revokedAt,
			});

		return result[0];
	});
}

export async function sendInvitationEmail(invitation: Invitation) {
	const result = await db
		.select({
			email: users.email,
		})
		.from(users)
		.where(eq(users.dbId, invitation.inviterUserDbId))
		.limit(1);
	const inviter = result[0];
	if (!inviter || !inviter.email) {
		throw new Error("Inviter not found");
	}

	const team = await db
		.select({
			name: teams.name,
		})
		.from(teams)
		.where(eq(teams.dbId, invitation.teamDbId))
		.limit(1);
	if (team.length === 0) {
		throw new Error("Team not found");
	}
	const teamName = team[0].name;

	await sendEmail(
		`Invitation to join ${teamName} on Giselle`,
		`You have been invited to join the team ${teamName} by ${inviter.email}.\n\n${buildJoinLink(
			invitation.token,
		)}`,
		[
			{
				userDisplayName: "",
				userEmail: invitation.email,
			},
		],
	);
}

function buildJoinLink(token: string) {
	const baseUrl =
		process.env.NEXT_PUBLIC_SITE_URL || "https://studio.giselles.ai";

	return `${baseUrl}/join/${token}`;
}

export async function listInvitations(): Promise<Invitation[]> {
	const currentTeam = await fetchCurrentTeam();
	const result = await db
		.select()
		.from(invitations)
		.where(
			and(
				eq(invitations.teamDbId, currentTeam.dbId),
				isNull(invitations.revokedAt),
			),
		);
	return result;
}

export async function revokeInvitation(token: string): Promise<void> {
	await db
		.update(invitations)
		.set({ revokedAt: new Date() })
		.where(eq(invitations.token, token));
}
