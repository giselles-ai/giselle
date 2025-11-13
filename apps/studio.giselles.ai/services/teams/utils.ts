import { createId } from "@paralleldrive/cuid2";
import type { CurrentTeam, TeamId } from "./types";

export function isProPlan(team: Pick<CurrentTeam, "plan">) {
	return (
		team.plan === "pro" ||
		team.plan === "enterprise" ||
		team.plan === "internal"
	);
}

const PLAN_LABELS: Record<string, string> = {
	free: "Free plan",
	pro: "Pro plan",
	enterprise: "Enterprise plan",
	internal: "Internal plan",
};

export function formatPlanName(plan: CurrentTeam["plan"]) {
	return PLAN_LABELS[plan] ?? `${capitalize(plan)} plan`;
}

function capitalize(value: string) {
	if (!value) return value;
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createTeamId(): TeamId {
	return `tm_${createId()}`;
}
