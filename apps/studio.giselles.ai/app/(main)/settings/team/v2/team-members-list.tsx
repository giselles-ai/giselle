import type { TeamRole } from "@/drizzle";
import type { TeamId } from "@/services/teams/types";
import { TeamMemberListItem } from "./team-members-list-item";

type TeamMembersListProps = {
	teamId: TeamId;
	members: {
		userId: string;
		displayName: string | null;
		email: string | null;
		role: TeamRole;
	}[];
	currentUserRole: TeamRole;
	isProPlan: boolean;
};

export function TeamMembersList({
	teamId,
	members,
	currentUserRole,
	isProPlan,
}: TeamMembersListProps) {
	return (
		<>
			{members.map((member) => (
				<TeamMemberListItem
					key={`${teamId}-${member.userId}`}
					userId={member.userId}
					displayName={member.displayName}
					email={member.email}
					role={member.role}
					currentUserRole={currentUserRole}
					isProPlan={isProPlan}
				/>
			))}
		</>
	);
}
