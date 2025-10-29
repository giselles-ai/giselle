import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { hasTeamPlanFeatures } from "@/services/teams/utils";
import { Card } from "../../components/card";
import { getCurrentUserRole, getTeamMembers } from "../actions";
import { listInvitations } from "../invitation";
import { InviteMemberDialog } from "../invite-member-dialog";
import { TeamMembersList } from "../team-members-list";

// Page title (glow effect preserved)
function PageTitle({ children }: { children: React.ReactNode }) {
	return <PageHeading glow>{children}</PageHeading>;
}

// Section header using semantic color + separator
function SectionHeader({ title }: { title: string }) {
	return (
		<div className="mb-2">
			<h2 className="text-text/60 text-[16px] leading-[27.2px] tracking-normal font-sans mb-1">
				{title}
			</h2>
			{/* separator removed to avoid double line with first row border */}
		</div>
	);
}

export default async function TeamMembersPage() {
	const team = await fetchCurrentTeam();
	const currentUser = await fetchCurrentUser();
	const { success: hasCurrentUserRole, data: currentUserRole } =
		await getCurrentUserRole();
	const { success: hasMembers, data: members } = await getTeamMembers();
	const canManageMembers =
		currentUserRole === "admin" && hasTeamPlanFeatures(team);
	const invitations = await listInvitations();

	if (!hasMembers || !members) {
		return (
			<div className="flex flex-col gap-[24px]">
				<PageTitle>Members</PageTitle>
				<Card title="" className="gap-0">
					<SectionHeader title="Member List" />
					<div className="text-[12px] leading-[20.4px] tracking-normal font-geist">
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
					<SectionHeader title="Member List" />
					<div className="text-[12px] leading-[20.4px] tracking-normal font-geist">
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
				<div className="flex items-center gap-3">
					<DocsLink
						href="https://docs.giselles.ai/en/guides/settings/team/members"
						target="_blank"
						rel="noopener noreferrer"
					>
						About Members
					</DocsLink>
					{canManageMembers && (
						<InviteMemberDialog
							memberEmails={members
								.map((member) => member.email)
								.filter((email) => email != null)}
							invitationEmails={invitations.map(
								(invitation) => invitation.email,
							)}
						/>
					)}
				</div>
			</div>
			<Card title="" className="gap-0">
				<SectionHeader title="Member List" />
				<TeamMembersList
					teamId={team.id}
					canManageMembers={canManageMembers}
					members={members}
					invitations={invitations}
					currentUserId={currentUser.id}
				/>
			</Card>
		</div>
	);
}
