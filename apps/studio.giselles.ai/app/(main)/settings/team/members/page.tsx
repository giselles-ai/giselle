import { teamInvitationViaEmailFlag } from "@/flags";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { Card } from "../../components/card";
import { getCurrentUserRole, getTeamMembers } from "../actions";
import { type Invitation, listInvitations } from "../invitation";
import { InviteMemberDialog } from "../invite-member-dialog";
import { TeamMembersList } from "../team-members-list";

// Custom title component with border
function TitleWithBorder({ title }: { title: string }) {
	return (
		<div className="mb-4">
			<h2 className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-hubot mb-3">
				{title}
			</h2>
			<div className="border-t border-black-400 pb-4" />
		</div>
	);
}

export default async function TeamMembersPage() {
	const team = await fetchCurrentTeam();
	const { success: hasCurrentUserRole, data: currentUserRole } =
		await getCurrentUserRole();
	const { success: hasMembers, data: members } = await getTeamMembers();
	const hasProPlan = isProPlan(team);
	const teamInvitationViaEmailEnabled = await teamInvitationViaEmailFlag();

	let invitations: Invitation[] = [];
	if (teamInvitationViaEmailEnabled) {
		invitations = await listInvitations();
	}

	if (!hasMembers || !members) {
		return (
			<div className="flex flex-col gap-[24px]">
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Members
				</h3>
				<Card title="">
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
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Members
				</h3>
				<Card title="">
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
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Members
				</h3>
				{hasProPlan && currentUserRole === "admin" && (
					<InviteMemberDialog
						teamInvitationViaEmailEnabled={teamInvitationViaEmailEnabled}
					/>
				)}
			</div>
			<Card title="">
				<TitleWithBorder title="Member List" />
				<TeamMembersList
					teamId={team.id}
					isProPlan={hasProPlan}
					members={members}
					invitations={invitations}
					currentUserRole={currentUserRole}
				/>
			</Card>
		</div>
	);
}
