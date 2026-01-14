import type { dataStores } from "@/db/schema";

export type ActionResult =
	| { success: true }
	| { success: false; error: string };

export type DataStoreListItem = Pick<
	typeof dataStores.$inferSelect,
	"id" | "name" | "createdAt" | "updatedAt"
>;
