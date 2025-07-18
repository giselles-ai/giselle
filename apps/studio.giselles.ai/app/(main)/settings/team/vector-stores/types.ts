export type DocumentLoaderErrorCode =
	| "DOCUMENT_NOT_FOUND"
	| "DOCUMENT_FETCH_ERROR"
	| "DOCUMENT_RATE_LIMITED"
	| "DOCUMENT_TOO_LARGE";

type Installation = {
	id: number;
	name: string;
};

type Repository = {
	id: number;
	owner: string;
	name: string;
};

export type InstallationWithRepos = {
	installation: Installation;
	repositories: Repository[];
};

export type ActionResult =
	| { success: true }
	| { success: false; error: string };

export type DiagnosticResult =
	| {
			canBeFixed: true;
			newInstallationId: number;
	  }
	| {
			canBeFixed: false;
			reason: "no-installation" | "repository-not-found" | "diagnosis-failed";
			errorMessage?: string;
	  };

import type {
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import type { ContentStatusMetadata } from "@/lib/vector-stores/github/ingest/content-metadata-schema";

export type RepositoryWithContentStatuses =
	typeof githubRepositoryIndex.$inferSelect & {
		contentStatuses: (typeof githubRepositoryContentStatus.$inferSelect)[];
	};

type ContentStatusWithParsedMetadata = Omit<
	typeof githubRepositoryContentStatus.$inferSelect,
	"metadata" | "dbId" | "repositoryIndexDbId"
> & {
	metadata: ContentStatusMetadata;
};

export type RepositoryIndexWithContentStatus = Omit<
	typeof githubRepositoryIndex.$inferSelect,
	"status" | "errorCode" | "retryAfter" | "lastIngestedCommitSha"
> & {
	blobStatus: ContentStatusWithParsedMetadata;
	// TODO: pullRequestsStatus?: ContentStatusWithParsedMetadata;
};
