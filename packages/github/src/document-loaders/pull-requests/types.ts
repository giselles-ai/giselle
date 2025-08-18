type GithubPullRequestContentType = "title_body" | "comment" | "diff";

/**
 * Metadata for GitHub Pull Request documents
 *
 * Each PR generates separate documents
 * - title+body
 * - comments
 * - diffs
 */
export type GitHubPullRequestMetadata = {
	owner: string;
	repo: string;
	prNumber: number;
	contentType: GithubPullRequestContentType;
	contentId: string; // comment ID or file path, "title_body" for title+body
	mergedAt: string;
};

/**
 * Configuration for GitHub Pull Requests loader
 */
export type GitHubPullRequestsLoaderConfig = {
	owner: string;
	repo: string;

	perPage?: number;
	maxPages?: number;

	// Processing options
	maxContentLength?: number;
};
