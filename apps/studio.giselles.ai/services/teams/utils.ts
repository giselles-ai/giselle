import { createId } from "@paralleldrive/cuid2";
import type { CurrentTeam, TeamId } from "./types";

export function isProPlan(team: CurrentTeam) {
	return team.activeSubscriptionId != null || team.type === "internal";
}

export function createTeamId(): TeamId {
	return `tm_${createId()}`;
}
