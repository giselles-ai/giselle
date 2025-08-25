"use server";

import * as Sentry from "@sentry/nextjs";
import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	agentActivities,
	agents,
	db,
	subscriptions,
	supabaseUserMappings,
	type TeamRole,
	teamMemberships,
	teams,
	type UserId,
	users,
} from "@/drizzle";
import { updateGiselleSession } from "@/lib/giselle-session";
import { getUser } from "@/lib/supabase";

import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { handleMemberChange } from "@/services/teams/member-change";
import type { TeamId } from "@/services/teams/types";
import {
	deleteAvatar,
	uploadAvatar,
	validateImageFile,
} from "../utils/avatar-upload";
import {
	createInvitation,
	type Invitation,
	listInvitations,
	revokeInvitation,
	sendInvitationEmail,
} from "./invitation";

function isUserId(value: string): value is UserId {
	return value.startsWith("usr_");
}

function isTeamRole(role: string): role is TeamRole {
	return role === "admin" || role === "member";
}

export async function updateTeamName(teamId: TeamId, formData: FormData) {
	const newName = formData.get("name") as string;
	const user = await getUser();

	try {
		await db.transaction(async (tx) => {
			const team = await tx
				.select({ dbId: teams.dbId })
				.from(teams)
				.for("update")
				.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
				.innerJoin(
					supabaseUserMappings,
					eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
				)
				.where(
					and(
						eq(supabaseUserMappings.supabaseUserId, user.id),
						eq(teams.id, teamId),
					),
				);

			if (team.length === 0) {
				throw new Error("Team not found");
			}

			await tx
				.update(teams)
				.set({ name: newName })
				.where(eq(teams.dbId, team[0].dbId));
		});
		revalidatePath("/settings/team");

		return { success: true };
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("not found")) {
				return { success: false, error: "Team not found or access denied" };
			}
			return { success: false, error: error.message };
		}
		return { success: false, error: "Failed to update team name" };
	}
}

export async function updateTeamAvatar(teamId: TeamId, formData: FormData) {
	try {
		const file = formData.get("avatar") as File | null;
		if (!file) {
			throw new Error("Missing avatar file");
		}

		if (!teamId) {
			throw new Error("Team ID is required");
		}

		// Validate the image file
		const validation = validateImageFile(file);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const user = await getUser();

		// Get current team avatar URL
		const [currentTeam] = await db
			.select({ avatarUrl: teams.avatarUrl })
			.from(teams)
			.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
			.innerJoin(
				supabaseUserMappings,
				eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
			)
			.where(
				and(
					eq(supabaseUserMappings.supabaseUserId, user.id),
					eq(teams.id, teamId),
				),
			);

		if (!currentTeam) {
			throw new Error(
				"Team not found or you don't have permission to modify it",
			);
		}

		const avatarUrl = await uploadAvatar(file, "team-avatars", teamId);

		await db.update(teams).set({ avatarUrl }).where(eq(teams.id, teamId));

		// Delete old avatar after successful DB update (failure is acceptable)
		if (currentTeam.avatarUrl) {
			try {
				await deleteAvatar(currentTeam.avatarUrl);
			} catch (error) {
				console.error("Failed to delete old avatar:", error);
			}
		}

		revalidatePath("/settings/team");
		revalidatePath("/", "layout");

		return {
			success: true,
			avatarUrl,
		};
	} catch (error) {
		if (error instanceof Error) {
			return {
				success: false,
				error: error.message,
			};
		}
		return {
			success: false,
			error: "An unexpected error occurred. Please try again.",
		};
	}
}

export async function getTeamMembers() {
	try {
		// Subquery: Get current user's team
		const currentTeam = await fetchCurrentTeam();

		// Main query: Get team members list
		const teamMembers = await db
			.select({
				userId: users.id,
				email: users.email,
				displayName: users.displayName,
				role: teamMemberships.role,
			})
			.from(users)
			.innerJoin(
				teamMemberships,
				and(
					eq(users.dbId, teamMemberships.userDbId),
					eq(teamMemberships.teamDbId, currentTeam.dbId),
				),
			)
			.orderBy(asc(teamMemberships.id));

		return {
			success: true,
			data: teamMembers,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to get team members",
		};
	}
}

export async function updateTeamMemberRole(formData: FormData) {
	try {
		const userId = formData.get("userId") as string;
		const role = formData.get("role") as string;

		if (!isUserId(userId)) {
			throw new Error("Invalid user ID");
		}

		if (!isTeamRole(role)) {
			throw new Error("Invalid role");
		}

		// 1. Get current user info and verify admin permission
		const currentUserRoleResult = await getCurrentUserRole();
		if (
			!currentUserRoleResult.success ||
			currentUserRoleResult.data !== "admin"
		) {
			throw new Error("Only admin users can update member roles");
		}

		const supabaseUser = await getUser();
		const currentUser = await db
			.select({ id: users.id })
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id))
			.limit(1);

		const isUpdatingSelf = currentUser[0].id === userId;

		// 2. Get current team
		const currentTeam = await fetchCurrentTeam();

		// 3. Get target user's dbId from users table
		const user = await db
			.select({ dbId: users.dbId })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (user.length === 0) {
			throw new Error("User not found");
		}

		// 4. Check if there is at least one other admin in the team
		if (role === "member" && isUpdatingSelf) {
			const otherAdminsCount = await db
				.select({
					count: count(),
				})
				.from(teamMemberships)
				.where(
					and(
						eq(teamMemberships.teamDbId, currentTeam.dbId),
						eq(teamMemberships.role, "admin"),
						ne(teamMemberships.userDbId, user[0].dbId), // Exclude self
					),
				);

			if (otherAdminsCount[0].count === 0) {
				throw new Error("Cannot remove the last admin from the team");
			}
		}

		// 5. Update team membership role
		await db
			.update(teamMemberships)
			.set({ role })
			.where(
				and(
					eq(teamMemberships.teamDbId, currentTeam.dbId),
					eq(teamMemberships.userDbId, user[0].dbId),
				),
			);

		revalidatePath("/settings/team");

		return {
			success: true,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to update team member role",
		};
	}
}

export async function deleteTeamMember(formData: FormData) {
	try {
		const userId = formData.get("userId") as string;
		const role = formData.get("role") as string;

		if (!isUserId(userId)) {
			throw new Error("Invalid user ID");
		}

		if (!isTeamRole(role)) {
			throw new Error("Invalid role");
		}

		// 1. Get current team and current user info
		const currentTeam = await fetchCurrentTeam();
		const currentUserRoleResult = await getCurrentUserRole();
		const supabaseUser = await getUser();
		const [currentUser] = await db
			.select({ id: users.id, dbId: users.dbId })
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id))
			.limit(1);

		const isDeletingSelf = currentUser.id === userId;

		// Only admins can remove other members
		if (
			!isDeletingSelf &&
			(!currentUserRoleResult.success || currentUserRoleResult.data !== "admin")
		) {
			throw new Error("Only admin users can remove team members");
		}

		// 2. Get target user's dbId from users table
		const user = await db
			.select({ dbId: users.dbId })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (user.length === 0) {
			throw new Error("User not found");
		}

		// 3. Ensure the team will still have at least one member
		const memberCount = await db
			.select({ count: count() })
			.from(teamMemberships)
			.where(eq(teamMemberships.teamDbId, currentTeam.dbId));

		if (memberCount[0].count === 1) {
			throw new Error("Cannot remove the last member from the team");
		}

		// 4. Check if user is an admin and if they are the last admin
		if (role === "admin") {
			const adminCount = await db
				.select({
					count: count(),
				})
				.from(teamMemberships)
				.where(
					and(
						eq(teamMemberships.teamDbId, currentTeam.dbId),
						eq(teamMemberships.role, "admin"),
					),
				);

			if (adminCount[0].count === 1) {
				throw new Error("Cannot remove the last admin from the team");
			}
		}

		// 5. If deleting self, check if user has other teams
		if (isDeletingSelf) {
			const teamCount = await db
				.select({
					count: count(),
				})
				.from(teamMemberships)
				.where(
					and(
						eq(teamMemberships.userDbId, user[0].dbId),
						ne(teamMemberships.teamDbId, currentTeam.dbId), // Exclude current team
					),
				);

			if (teamCount[0].count === 0) {
				throw new Error("Cannot leave the team when it's your only team");
			}
		}

		// 6. Delete team membership
		await db
			.delete(teamMemberships)
			.where(
				and(
					eq(teamMemberships.teamDbId, currentTeam.dbId),
					eq(teamMemberships.userDbId, user[0].dbId),
				),
			);

		await handleMemberChange(currentTeam);
		revalidatePath("/settings/team");

		return { success: true };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete team member",
		};
	}
}

export async function getCurrentUserRole() {
	try {
		const supabaseUser = await getUser();
		const currentTeam = await fetchCurrentTeam();

		const result = await db
			.select({
				role: teamMemberships.role,
			})
			.from(teamMemberships)
			.innerJoin(
				supabaseUserMappings,
				eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
			)
			.where(
				and(
					eq(supabaseUserMappings.supabaseUserId, supabaseUser.id),
					eq(teamMemberships.teamDbId, currentTeam.dbId),
				),
			)
			.limit(1);

		if (result.length === 0) {
			throw new Error("User role not found");
		}

		return {
			success: true,
			data: result[0].role,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to get current user role",
		};
	}
}

export async function getAgentActivities({
	limit = 50,
}: {
	limit?: number;
} = {}) {
	try {
		const currentTeam = await fetchCurrentTeam();

		const activities = await db
			.select({
				agentId: agents.id,
				agentName: agents.name,
				startTime: agentActivities.startedAt,
				endTime: agentActivities.endedAt,
				usedCharge: agentActivities.totalDurationMs,
			})
			.from(agentActivities)
			.innerJoin(
				agents,
				and(
					eq(agentActivities.agentDbId, agents.dbId),
					eq(agents.teamDbId, currentTeam.dbId),
				),
			)
			.orderBy(desc(agentActivities.startedAt))
			.limit(limit);

		const formattedActivities = activities.map((activity) => {
			const durationInSeconds = Number(activity.usedCharge) / 1000;

			const validDuration = Number.isNaN(durationInSeconds)
				? 0
				: durationInSeconds;

			return {
				...activity,
				// Convert milliseconds to seconds and round to 2 decimal places
				usedCharge: Math.ceil(validDuration * 100) / 100,
			};
		});

		return {
			success: true,
			data: formattedActivities,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to get agent activities",
		};
	}
}

export async function deleteTeam(
	_prevState: { error: string },
	_formData: FormData,
) {
	try {
		// Get current user's info and team
		const currentTeam = await fetchCurrentTeam();
		const currentUserRoleResult = await getCurrentUserRole();

		// Check if user is admin
		if (
			!currentUserRoleResult.success ||
			currentUserRoleResult.data !== "admin"
		) {
			throw new Error("Only admin users can delete teams");
		}

		// Check if team is on Free plan
		if (isProPlan(currentTeam)) {
			throw new Error("Only free plan teams can be deleted");
		}

		// Get current user's other teams count
		const supabaseUser = await getUser();
		const otherTeams = await db
			.select({
				teamId: teams.id,
			})
			.from(teams)
			.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
			.innerJoin(
				supabaseUserMappings,
				eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
			)
			.where(
				and(
					eq(supabaseUserMappings.supabaseUserId, supabaseUser.id),
					ne(teams.dbId, currentTeam.dbId),
				),
			)
			.limit(1);

		// Check if user has other teams
		if (otherTeams.length === 0) {
			throw new Error("Cannot delete your only team");
		}

		// Delete team and all related data with cascading
		await db.delete(teams).where(eq(teams.dbId, currentTeam.dbId));

		// Refresh session to switch to another team after deletion
		// This ensures that the user is redirected to a valid team context and prevents access to the deleted team's resources.
		await updateGiselleSession({ teamId: otherTeams[0].teamId });
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Failed to delete team",
		};
	}

	// Redirect to team settings page when team is deleted
	redirect("/settings/team");
}

export async function getSubscription(subscriptionId: string) {
	try {
		const [dbSubscription] = await db
			.select({
				cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
				cancelAt: subscriptions.cancelAt,
			})
			.from(subscriptions)
			.where(eq(subscriptions.id, subscriptionId));

		if (!dbSubscription) {
			throw new Error(`Subscription not found: ${subscriptionId}`);
		}

		return {
			success: true,
			data: dbSubscription,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to fetch subscription",
		};
	}
}

// Define result types for sendInvitations
type InvitationResult = {
	email: string;
	status: "success" | "db_error" | "email_error" | "unknown_error";
	error?: string;
};

export type SendInvitationsResult = {
	overallStatus: "success" | "partial_success" | "failure";
	results: InvitationResult[];
};

// Update sendInvitations function
export async function sendInvitationsAction(
	emails: string[],
	role: TeamRole,
): Promise<SendInvitationsResult> {
	const currentUser = await fetchCurrentUser();
	const currentTeam = await fetchCurrentTeam();

	const invitationPromises = emails.map(
		async (email): Promise<InvitationResult> => {
			let invitation: Invitation | null = null;
			try {
				invitation = await createInvitation(
					email,
					role,
					currentTeam,
					currentUser,
				);
				await sendInvitationEmail(invitation);
				return { email, status: "success" };
			} catch (error: unknown) {
				const status = invitation ? "email_error" : "db_error";
				const errorMessage =
					error instanceof Error
						? error.message
						: "Unknown error during invitation process";
				return { email, status, error: errorMessage };
			}
		},
	);

	const settledResults = await Promise.allSettled(invitationPromises);

	const detailedResults: InvitationResult[] = settledResults.map(
		(result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			// Capture unexpected errors in Sentry
			Sentry.captureException(result.reason);
			const reason = result.reason as unknown;
			const errorMessage =
				reason instanceof Error
					? reason.message
					: "Unexpected processing error";
			return {
				email: emails[index],
				status: "unknown_error",
				error: errorMessage,
			};
		},
	);

	const successfulCount = detailedResults.filter(
		(r) => r.status === "success",
	).length;
	let overallStatus: SendInvitationsResult["overallStatus"];
	if (successfulCount === emails.length) {
		overallStatus = "success";
	} else if (successfulCount > 0) {
		overallStatus = "partial_success";
	} else {
		overallStatus = "failure";
	}

	revalidatePath("/settings/team/members");

	return {
		overallStatus,
		results: detailedResults,
	};
}

// Define a unified result type for actions
type ActionResult = { success: true } | { success: false; error: string };

export async function revokeInvitationAction(
	_prevState: ActionResult | undefined,
	formData: FormData,
): Promise<ActionResult> {
	const token = formData.get("token") as string;
	try {
		// Check if current user is admin
		const currentUserRoleResult = await getCurrentUserRole();
		if (
			!currentUserRoleResult.success ||
			currentUserRoleResult.data !== "admin"
		) {
			throw new Error("Only admin users can revoke invitations");
		}

		await revokeInvitation(token);
		revalidatePath("/settings/team/members");
		return { success: true };
	} catch (e: unknown) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Unknown error",
		};
	}
}

export async function resendInvitationAction(
	_prevState: ActionResult | undefined,
	formData: FormData,
): Promise<ActionResult> {
	const token = formData.get("token") as string;
	try {
		// Check if current user is admin
		const currentUserRoleResult = await getCurrentUserRole();
		if (
			!currentUserRoleResult.success ||
			currentUserRoleResult.data !== "admin"
		) {
			throw new Error("Only admin users can resend invitations");
		}

		const invitations = await listInvitations();
		const invitation = invitations.find((inv) => inv.token === token);
		if (!invitation) {
			throw new Error("Invitation not found");
		}
		// 1. revoke existing invitation
		await revokeInvitation(token);
		// 2. create new invitation
		const currentTeam = await fetchCurrentTeam();
		const currentUser = await fetchCurrentUser();
		const newInvitation = await createInvitation(
			invitation.email,
			invitation.role,
			currentTeam,
			currentUser,
		);
		// 3. send invitation email
		await sendInvitationEmail(newInvitation);
		revalidatePath("/settings/team/members");
		return { success: true };
	} catch (e: unknown) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Unknown error",
		};
	}
}
