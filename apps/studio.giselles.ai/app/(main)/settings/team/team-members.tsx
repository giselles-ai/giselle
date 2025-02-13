import { Card } from "@/app/(main)/settings/components/card";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { getCurrentUserRole, getTeamMembers } from "./actions";
import { TeamMembersForm } from "./team-members-form";
import { TeamMembersList } from "./team-members-list";

export async function TeamMembers() {
	const team = await fetchCurrentTeam();
	const { success: hasMembers, data: members } = await getTeamMembers();
	const { success: hasCurrentUserRole, data: currentUserRole } =
		await getCurrentUserRole();

	if (!hasMembers || !members) {
		return (
			<Card title="Team members">
				<div className="text-sm text-destructive">
					Failed to load team members
				</div>
			</Card>
		);
	}

	if (!hasCurrentUserRole || !currentUserRole) {
		return (
			<Card title="Team members">
				<div className="text-sm text-destructive">
					Failed to get current user role
				</div>
			</Card>
		);
	}

	const hasProPlan = isProPlan(team);

	return (
		<Card title="Team members">
			{hasProPlan && currentUserRole === "admin" && <TeamMembersForm />}
			<TeamMembersList
				teamId={team.id}
				isProPlan={hasProPlan}
				members={members}
				currentUserRole={currentUserRole}
			/>
		</Card>
	);
}
