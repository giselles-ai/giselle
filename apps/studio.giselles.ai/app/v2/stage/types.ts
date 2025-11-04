import type { IconName } from "lucide-react/dynamic";
import type { teams } from "@/db";

export type TeamId = (typeof teams.$inferSelect)["id"];

export interface App {
	id: string;
	name: string;
	description: string;
	iconName: IconName;
}
