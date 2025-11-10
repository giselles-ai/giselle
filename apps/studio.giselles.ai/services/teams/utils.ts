import { createId } from "@paralleldrive/cuid2";
import type { CurrentTeam, TeamId } from "./types";

export function isProPlan(
	team: Pick<CurrentTeam, "activeSubscriptionId" | "plan">,
) {
	if (team.plan === "pro" || team.plan === "internal") {
		return true;
	}
	// Defensive fallback while plan is being rolled out
	return team.activeSubscriptionId != null;
}

export function createTeamId(): TeamId {
	return `tm_${createId()}`;
}

export function hasTeamPlanFeatures(team: CurrentTeam) {
	return team.plan === "internal";
}
