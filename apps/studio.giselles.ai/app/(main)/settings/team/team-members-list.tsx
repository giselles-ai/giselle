"use client";
import type { TeamRole } from "@/db";
import type { TeamId } from "@/services/teams/types";
import type { Invitation } from "./invitation";
import { InvitationListItem } from "./invitation-list-item";
import { TeamMemberListItem } from "./team-members-list-item";

type TeamMembersListProps = {
	teamId: TeamId;
	members: {
		userId: string;
		displayName: string | null;
		email: string | null;
		avatarUrl: string | null;
		role: TeamRole;
	}[];
	invitations: Invitation[];
	canManageMembers: boolean;
	currentUserId: string;
};

export function TeamMembersList({
	teamId,
	members,
	invitations,
	canManageMembers,
	currentUserId,
}: TeamMembersListProps) {
	// internal Toast is globally provided via layout; no per-list usage required

	return (
		<>
			{members.map((member) => (
				<TeamMemberListItem
					key={`${teamId}-${member.userId}`}
					userId={member.userId}
					displayName={member.displayName}
					email={member.email}
					avatarUrl={member.avatarUrl}
					role={member.role}
					canManageMembers={canManageMembers}
					currentUserId={currentUserId}
				/>
			))}

			{invitations.length > 0 &&
				invitations.map((invitation) => (
					<InvitationListItem
						key={invitation.token}
						token={invitation.token}
						email={invitation.email}
						role={invitation.role}
						expiredAt={invitation.expiredAt}
						canManageMembers={canManageMembers}
					/>
				))}
			{/* Internal toast renders via provider viewport globally */}
		</>
	);
}
