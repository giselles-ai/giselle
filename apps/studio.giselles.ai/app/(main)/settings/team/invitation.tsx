import { render, toPlainText } from "@react-email/components";
import { and, count, eq, gt, isNull, sql } from "drizzle-orm";
import type { TeamRole, UserId } from "@/db";
import { db } from "@/db";
import { invitations, teamMemberships, teams, users } from "@/db/schema";
import TeamInvitationEmail from "@/emails/transactional/team-invitation";
import { sendEmail } from "@/services/external/email";
import { type CurrentTeam, fetchCurrentTeam } from "@/services/teams";
import { getTeamMemberQuota } from "@/services/teams/plan-features/team-members";

export type Invitation = typeof invitations.$inferSelect;

export const INVITE_MEMBERS_NOT_AVAILABLE_ERROR =
	"Inviting members is not available for this team plan.";
export const TEAM_MEMBER_LIMIT_REACHED_ERROR =
	"You've used all seats included in your plan. Remove a member or upgrade to invite more teammates.";

export function createInvitation(
	email: string,
	role: TeamRole,
	currentTeam: CurrentTeam,
	currentUser: {
		dbId: number;
		id: UserId;
	},
): Promise<Invitation> {
	const quota = getTeamMemberQuota(currentTeam.plan);
	if (!quota.isAvailable) {
		throw new Error(INVITE_MEMBERS_NOT_AVAILABLE_ERROR);
	}

	const normalizedEmail = email.trim().toLowerCase();
	const token = crypto.randomUUID();
	const expiredAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

	return db.transaction(async (tx) => {
		// serialize team seat accounting then acquire per-email lock
		await tx.execute(sql`SELECT pg_advisory_xact_lock(${currentTeam.dbId}, 0)`);
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

		// enforce seat quota after locking to avoid race conditions
		const [memberCountResult] = await tx
			.select({ value: count() })
			.from(teamMemberships)
			.where(eq(teamMemberships.teamDbId, currentTeam.dbId));

		const [pendingInvitationResult] = await tx
			.select({ value: count() })
			.from(invitations)
			.where(
				and(
					eq(invitations.teamDbId, currentTeam.dbId),
					isNull(invitations.revokedAt),
					gt(invitations.expiredAt, new Date()),
				),
			);

		const memberCount = Number(memberCountResult?.value ?? 0);
		const pendingInvitations = Number(pendingInvitationResult?.value ?? 0);
		if (memberCount + pendingInvitations >= quota.maxMembers) {
			throw new Error(TEAM_MEMBER_LIMIT_REACHED_ERROR);
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

	const emailHtml = await render(
		<TeamInvitationEmail
			teamName={teamName}
			inviterEmail={inviter.email}
			joinUrl={buildJoinLink(invitation.token)}
		/>,
	);
	const emailText = toPlainText(emailHtml);

	await sendEmail(
		`Invitation to join ${teamName} on Giselle`,
		emailText,
		[
			{
				userDisplayName: "",
				userEmail: invitation.email,
			},
		],
		{ html: emailHtml },
	);
}

function buildJoinLink(token: string) {
	const explicitBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
	if (explicitBaseUrl) {
		return new URL(`/join/${token}`, explicitBaseUrl).toString();
	}

	const vercelUrl = process.env.VERCEL_URL;
	if (vercelUrl) {
		const normalizedBaseUrl = `https://${vercelUrl}`;
		return new URL(`/join/${token}`, normalizedBaseUrl).toString();
	}

	throw new Error(
		"Missing NEXT_PUBLIC_SITE_URL or VERCEL_URL environment variables for invitation links",
	);
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
