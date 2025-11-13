import { createId } from "@paralleldrive/cuid2";
import type { CurrentTeam, TeamId } from "./types";

export function isProPlan(team: Pick<CurrentTeam, "plan">) {
	return team.plan === "pro" || team.plan === "internal";
}

export function createTeamId(): TeamId {
	return `tm_${createId()}`;
}
