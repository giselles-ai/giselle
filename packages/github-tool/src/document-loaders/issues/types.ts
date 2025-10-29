export const GitHubIssueStateValues = ["OPEN", "CLOSED"] as const;
export type GitHubIssueState = (typeof GitHubIssueStateValues)[number];

export const GitHubIssueStateReasonValues = [
	"COMPLETED",
	"DUPLICATE",
	"NOT_PLANNED",
	"REOPENED",
] as const;
export type GitHubIssueStateReason =
	(typeof GitHubIssueStateReasonValues)[number];

export const GitHubRepositoryIssueContentTypeValues = [
	"title_body",
	"comment",
] as const;
export type GitHubRepositoryIssueContentType =
	(typeof GitHubRepositoryIssueContentTypeValues)[number];

export type GitHubIssueDocumentKey =
	`${number}:${GitHubRepositoryIssueContentType}:${string}`;

export type GitHubIssueMetadata = {
	owner: string;
	repo: string;

	issueNumber: number;
	issueState: GitHubIssueState;
	issueStateReason: GitHubIssueStateReason | null;
	issueUpdatedAt: string;
	issueClosedAt: string | null;

	contentType: GitHubRepositoryIssueContentType;
	contentId: string;
	contentCreatedAt: string;
	contentEditedAt: string;
};

export type GitHubIssuesLoaderConfig = {
	owner: string;
	repo: string;

	perPage?: number;
	maxPages?: number;

	maxContentLength?: number;
};

export type IssueCommentDetails = {
	id: string;
	body: string;
	authorType: string;
};

export type IssueDetails = {
	title: string;
	body: string;
	comments: IssueCommentDetails[];
};
