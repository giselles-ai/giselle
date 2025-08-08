import type { subscriptions, teams } from "@/drizzle";

export type TeamId = `tm_${string}`;
export function isTeamId(id: string): id is TeamId {
	return id.startsWith("tm_");
}

export type CurrentTeam = {
	id: typeof teams.$inferSelect.id;
	dbId: typeof teams.$inferSelect.dbId;
	name: typeof teams.$inferSelect.name;
	profileImageUrl?: typeof teams.$inferSelect.profileImageUrl;
	type: typeof teams.$inferSelect.type;
	activeSubscriptionId: typeof subscriptions.$inferInsert.id | null;
};

export type Team = {
	id: typeof teams.$inferSelect.id;
	name: typeof teams.$inferSelect.name;
	profileImageUrl?: typeof teams.$inferSelect.profileImageUrl;
	isPro?: boolean;
};
