import type { TeamPlan } from "@/db/schema";

type TeamMemberQuota = {
	/** Whether the plan allows inviting additional members */
	isAvailable: boolean;
	/** Total number of members (including the owner) allowed on the plan */
	maxMembers: number;
};

const TEAM_MEMBER_QUOTAS: Record<TeamPlan, TeamMemberQuota> = {
	free: { isAvailable: false, maxMembers: 1 },
	pro: { isAvailable: false, maxMembers: 1 },
	team: { isAvailable: true, maxMembers: 10 },
	// NOTE: Enterprise uses temporary values until we support per-contract limits.
	enterprise: { isAvailable: true, maxMembers: 100 },
	internal: { isAvailable: true, maxMembers: 100 },
};

export function getTeamMemberQuota(plan: TeamPlan): TeamMemberQuota {
	return TEAM_MEMBER_QUOTAS[plan];
}

export function canManageTeamMembers(plan: TeamPlan): boolean {
	return TEAM_MEMBER_QUOTAS[plan].isAvailable;
}

export function getTeamMemberLimit(plan: TeamPlan): number {
	return TEAM_MEMBER_QUOTAS[plan].maxMembers;
}
