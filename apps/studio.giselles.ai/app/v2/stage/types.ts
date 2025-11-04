import type { teams } from "@/db";

export type TeamId = (typeof teams.$inferSelect)["id"];
