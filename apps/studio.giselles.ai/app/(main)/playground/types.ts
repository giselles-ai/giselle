import type {
	AppId,
	AppParameter,
	NodeId,
	WorkspaceId,
} from "@giselles-ai/protocol";

export interface StageApp {
	id: AppId;
	name: string;
	description: string;
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
