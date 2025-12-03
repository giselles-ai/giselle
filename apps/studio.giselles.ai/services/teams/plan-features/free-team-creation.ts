import type { TeamPlan } from "@/db/schema";
import { isEmailFromRoute06 } from "@/lib/utils";

/**
 * Determines if a user can create a free team.
 * - Internal users (route06.co.jp) cannot create free teams
 * - Users who already have a free team cannot create another
 */
export function canCreateFreeTeam(
	email: string | null | undefined,
	existingTeamPlans: TeamPlan[],
): boolean {
	const isInternalUser = email != null && isEmailFromRoute06(email);
	if (isInternalUser) {
		return false;
	}

	const hasExistingFreeTeam = existingTeamPlans.some((plan) => plan === "free");
	return !hasExistingFreeTeam;
}
