import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { TeamPlan } from "@/db/schema";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import {
	canManageTeamMembers,
	getTeamMemberQuota,
} from "@/services/teams/plan-features/team-members";
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

type TeamMemberPlanNoticeProps = {
	hasAccess: boolean;
	memberCount: number;
	pendingInvitationCount: number;
	maxMembers: number;
	plan: TeamPlan;
};

function TeamMemberPlanNotice({
	hasAccess,
	memberCount,
	pendingInvitationCount,
	maxMembers,
	plan,
}: TeamMemberPlanNoticeProps) {
	const planLabel = getPlanLabel(plan);
	if (!hasAccess) {
		return (
			<Alert
				variant="destructive"
				className="border-error-900/40 bg-error-900/10 text-error-900"
			>
				<AlertTitle className="text-[13px] font-semibold text-error-900">
					Team collaboration is not included in the {planLabel} plan
				</AlertTitle>
				<AlertDescription className="text-[12px] text-error-900/80">
					The {planLabel} plan supports a single user. Upgrade to the{" "}
					<Link className="underline" href="/settings/team">
						Team plan
					</Link>{" "}
					to collaborate with up to 10 members.
				</AlertDescription>
			</Alert>
		);
	}

	const totalSeatsUsed = memberCount + pendingInvitationCount;
	const remainingSeats = Math.max(maxMembers - totalSeatsUsed, 0);
	const limitReached = remainingSeats === 0;

	return (
		<div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
			<div className="flex items-center justify-between text-[13px] text-text/70">
				<span>Seats used (members + pending invites)</span>
				<span className="font-semibold text-inverse">
					{totalSeatsUsed} / {maxMembers}
				</span>
			</div>
			<p className="mt-1 text-[12px] text-text/60">
				{limitReached
					? `You've used all seats included in your ${planLabel} plan.`
					: `${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining in your ${planLabel} plan.`}
				{pendingInvitationCount > 0 &&
					` Pending invitation${pendingInvitationCount === 1 ? "" : "s"} count toward this limit.`}
			</p>
			{limitReached && (
				<Alert
					variant="destructive"
					className="mt-3 border-error-900/40 bg-error-900/10 text-error-900"
				>
					<AlertTitle className="text-[13px] font-semibold text-error-900">
						Maximum capacity reached
					</AlertTitle>
					<AlertDescription className="text-[12px] text-error-900/80">
						Remove a member or upgrade your plan in{" "}
						<Link className="underline" href="/settings/team">
							Team Settings
						</Link>{" "}
						to invite more teammates.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

const PLAN_LABELS: Record<TeamPlan, string> = {
	free: "Free",
	pro: "Pro",
	team: "Team",
	enterprise: "Enterprise",
	internal: "Internal",
};

function getPlanLabel(plan: TeamPlan) {
	return PLAN_LABELS[plan];
}

export default async function TeamMembersPage() {
	const team = await fetchCurrentTeam();
	const currentUser = await fetchCurrentUser();
	const { success: hasCurrentUserRole, data: currentUserRole } =
		await getCurrentUserRole();
	const { success: hasMembers, data: members } = await getTeamMembers();
	const canManageMembers =
		currentUserRole === "admin" && canManageTeamMembers(team.plan);
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

	const memberQuota = getTeamMemberQuota(team.plan);
	const planLabel = getPlanLabel(team.plan);
	const now = Date.now();
	const activeInvitations = invitations.filter(
		(invitation) => invitation.expiredAt.getTime() > now,
	);
	const pendingInvitationCount = activeInvitations.length;
	const totalSeatsUsed = members.length + pendingInvitationCount;
	const seatsRemaining = Math.max(memberQuota.maxMembers - totalSeatsUsed, 0);
	const inviteButtonDisabled =
		memberQuota.isAvailable && seatsRemaining === 0 && canManageMembers;
	const inviteDisabledReason = inviteButtonDisabled
		? `You have used all seats included in your ${planLabel} plan. Remove a member or upgrade to invite more teammates.`
		: undefined;

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
							disabled={inviteButtonDisabled}
							disabledReason={inviteDisabledReason}
						/>
					)}
				</div>
			</div>
			<Card title="" className="gap-0">
				<SectionHeader title="Member List" />
				<div className="mb-6">
					<TeamMemberPlanNotice
						hasAccess={memberQuota.isAvailable}
						memberCount={members.length}
						pendingInvitationCount={pendingInvitationCount}
						maxMembers={memberQuota.maxMembers}
						plan={team.plan}
					/>
				</div>
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
