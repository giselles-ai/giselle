import { createId } from "@paralleldrive/cuid2";
import type { CurrentTeam, TeamId } from "./types";

export function isProPlan(
	team: Pick<CurrentTeam, "activeSubscriptionId" | "type" | "plan">,
) {
	if (team.plan === "pro" || team.plan === "internal") {
		return true;
	}
	// Defensive fallback while plan is being rolled out
	return team.activeSubscriptionId != null || team.type === "internal";
}

export function createTeamId(): TeamId {
	return `tm_${createId()}`;
}

export function hasTeamPlanFeatures(team: CurrentTeam) {
	if (team.type === "internal") {
		return true;
	}

	// TODO: extend to support customer teams when Team plan is introduced
	return false;
}
