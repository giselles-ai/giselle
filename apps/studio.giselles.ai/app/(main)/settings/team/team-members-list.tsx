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
		<div className="font-avenir rounded-[16px]">
			<div className="grid grid-cols-[1fr_1fr_200px] gap-4 border-b border-zinc-800 bg-zinc-900/50 p-4 font-medium text-zinc-200">
				<div>Display name</div>
				<div>Email</div>
				<div>Role</div>
			</div>
			<div className="divide-y divide-zinc-800">
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
			</div>
		</div>
	);
}
