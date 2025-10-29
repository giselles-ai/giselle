import { createId } from "@paralleldrive/cuid2";
import type { CurrentTeam, TeamId } from "./types";

export function isProPlan(
	team: Pick<CurrentTeam, "activeSubscriptionId" | "type">,
) {
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
