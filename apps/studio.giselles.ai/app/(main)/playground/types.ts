import type {
	AppId,
	AppParameter,
	NodeId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import type { IconName } from "lucide-react/dynamic";
import type { teams } from "@/db";

export type TeamId = (typeof teams.$inferSelect)["id"];

export interface StageApp {
	id: AppId;
	name: string;
	description: string;
	iconName: IconName;
	entryNodeId: NodeId;
	workspaceId: WorkspaceId;
	workspaceName: string;
	parameters: AppParameter[];
	isMine: boolean;
	vectorStoreRepositories: string[];
	vectorStoreFiles: string[];
	llmProviders: string[];
	creator: {
		displayName: string | null;
		avatarUrl: string | null;
	} | null;
}
