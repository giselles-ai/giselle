import type { subscriptions, teams } from "@/db";

export type TeamId = `tm_${string}`;
export function isTeamId(id: string): id is TeamId {
	return id.startsWith("tm_");
}

export type CurrentTeam = {
	id: typeof teams.$inferSelect.id;
	dbId: typeof teams.$inferSelect.dbId;
	name: typeof teams.$inferSelect.name;
	avatarUrl?: typeof teams.$inferSelect.avatarUrl;
	type: typeof teams.$inferSelect.type;
	plan: typeof teams.$inferSelect.plan;
	activeSubscriptionId: typeof subscriptions.$inferInsert.id | null;
};

export type TeamWithSubscription = CurrentTeam;

export type Team = {
	id: typeof teams.$inferSelect.id;
	name: typeof teams.$inferSelect.name;
	avatarUrl?: typeof teams.$inferSelect.avatarUrl;
	plan?: typeof teams.$inferSelect.plan;
	isPro?: boolean;
};
