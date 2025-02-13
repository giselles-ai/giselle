export type GitHubTriggerEvent =
	| "github.issue_comment.created"
	| "github.issue_comment.edited"
	| "github.issue_comment.deleted";

export type GitHubNextAction = "github.issue_comment.reply";
