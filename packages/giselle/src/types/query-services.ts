import type { EmbeddingProfileId, WorkspaceId } from "@giselles-ai/protocol";
import type { QueryService } from "@giselles-ai/rag";

export type GithubEmbeddingMetadata = {
	fileSha: string;
	path: string;
};

export type GitHubQueryContext = {
	provider: "github";
	workspaceId: WorkspaceId;
	owner: string;
	repo: string;
	contentType: "blob" | "pullRequest" | "issue";
	embeddingProfileId: EmbeddingProfileId;
};

export type DocumentVectorStoreQueryContext = {
	provider: "document";
	workspaceId: WorkspaceId;
	documentVectorStoreId: string;
	embeddingProfileId: EmbeddingProfileId;
};

export type QueryContext = GitHubQueryContext | DocumentVectorStoreQueryContext;

export type GitHubVectorStoreQueryService<
	M extends Record<string, unknown> = Record<string, never>,
> = QueryService<GitHubQueryContext, M>;

export type DocumentVectorStoreQueryService<
	M extends Record<string, unknown> = Record<string, never>,
> = QueryService<DocumentVectorStoreQueryContext, M>;
