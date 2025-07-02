import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { Card } from "../../components/card";
import { getCurrentUserRole, getTeamMembers } from "../actions";
import { listInvitations } from "../invitation";
import { InviteMemberDialog } from "../invite-member-dialog";
import { TeamMembersList } from "../team-members-list";

// Reusable page title component (h1)
function PageTitle({ children }: { children: React.ReactNode }) {
	return (
		<h1
			className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
			style={{
				textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
			}}
		>
			{children}
		</h1>
	);
}

// Custom title component with border
function TitleWithBorder({ title }: { title: string }) {
	return (
		<div className="mb-2">
			<h2 className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans mb-1">
				{title}
			</h2>
			<div className="pb-2" />
		</div>
	);
}

export default async function TeamMembersPage() {
	const team = await fetchCurrentTeam();
	const currentUser = await fetchCurrentUser();
	const { success: hasCurrentUserRole, data: currentUserRole } =
		await getCurrentUserRole();
	const { success: hasMembers, data: members } = await getTeamMembers();
	const hasProPlan = isProPlan(team);
	const invitations = await listInvitations();

	if (!hasMembers || !members) {
		return (
			<div className="flex flex-col gap-[24px]">
				<PageTitle>Members</PageTitle>
				<Card title="" className="gap-0">
					<TitleWithBorder title="Member List" />
					<div className="text-error-900 text-[12px] leading-[20.4px] tracking-normal font-geist">
						Failed to load team members
					</div>
				</Card>
			</div>
		);
	}

	if (!hasCurrentUserRole || !currentUserRole) {
		return (
			<div className="flex flex-col gap-[24px]">
				<PageTitle>Members</PageTitle>
				<Card title="" className="gap-0">
					<TitleWithBorder title="Member List" />
					<div className="text-error-900 text-[12px] leading-[20.4px] tracking-normal font-geist">
						Failed to get current user role
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center w-full">
				<PageTitle>Members</PageTitle>
				{hasProPlan && currentUserRole === "admin" && (
					<InviteMemberDialog
						memberEmails={members
							.map((member) => member.email)
							.filter((email) => email != null)}
						invitationEmails={invitations.map((invitation) => invitation.email)}
					/>
				)}
			</div>
			<Card title="" className="gap-0">
				<TitleWithBorder title="Member List" />
				<TeamMembersList
					teamId={team.id}
					isProPlan={hasProPlan}
					members={members}
					invitations={invitations}
					currentUserRole={currentUserRole}
					currentUserId={currentUser.id}
				/>
			</Card>
		</div>
	);
}
