import type { Client } from "urql";
import { GetIssueDetailsQuery, GetIssuesMetadataQuery } from "./queries";
import type {
	GitHubIssueState,
	GitHubIssueStateReason,
	IssueCommentDetails,
	IssueDetails,
} from "./types";

export type FetchContext = {
	client: Client;
	owner: string;
	repo: string;
};

type RenamedTitleEvent = {
	__typename?: "RenamedTitleEvent";
	createdAt: string;
};

/**
 * Type guard to check if timeline item is a RenamedTitleEvent
 */
function isRenamedTitleEvent(item: unknown): item is RenamedTitleEvent {
	return (
		typeof item === "object" &&
		item !== null &&
		"createdAt" in item &&
		typeof item.createdAt === "string"
	);
}

/**
 * Extract title last updated time from timeline items
 */
function getTitleUpdatedAt(firstTimelineItem: unknown): string | null {
	if (!isRenamedTitleEvent(firstTimelineItem)) {
		return null;
	}
	return firstTimelineItem.createdAt;
}

/**
 * Calculate the most recent edit time for an issue, considering both title and body edits
 */
function calculateContentEditedAt(
	bodyEditedAt: string,
	titleUpdatedAt: string | null,
): string {
	if (!titleUpdatedAt) {
		return bodyEditedAt;
	}

	const titleTime = new Date(titleUpdatedAt).getTime();
	const bodyTime = new Date(bodyEditedAt).getTime();

	return titleTime > bodyTime ? titleUpdatedAt : bodyEditedAt;
}

export async function fetchIssuesMetadata(
	ctx: FetchContext,
	options: {
		first: number;
		after?: string | null;
	},
): Promise<{
	issues: Array<{
		number: number;
		state: GitHubIssueState;
		stateReason: GitHubIssueStateReason | null;
		createdAt: string;
		updatedAt: string;
		closedAt: string | null;
		editedAt: string;
		comments: Array<{
			id: string;
			createdAt: string;
			editedAt: string;
		}>;
	}>;
	pageInfo: {
		hasNextPage: boolean;
		endCursor: string | null;
	};
}> {
	const result = await ctx.client.query(GetIssuesMetadataQuery, {
		owner: ctx.owner,
		repo: ctx.repo,
		first: options.first,
		after: options.after,
	});

	if (result.error) {
		throw result.error;
	}

	const issuesConnection = result.data?.repository?.issues;
	if (issuesConnection === undefined) {
		throw new Error("Failed to fetch issues");
	}

	const issues =
		issuesConnection.nodes
			?.map((issue) => {
				if (!issue) return null;

				const titleUpdatedAt = getTitleUpdatedAt(
					issue.timelineItems?.nodes?.[0],
				);
				const contentEditedAt = calculateContentEditedAt(
					issue.lastEditedAt ?? issue.createdAt,
					titleUpdatedAt,
				);

				const comments =
					issue.comments?.nodes
						?.map((comment) => {
							if (comment === null) return null;

							return {
								id: comment.id,
								createdAt: comment.createdAt,
								editedAt: comment.lastEditedAt ?? comment.createdAt,
							};
						})
						.filter((comment) => comment !== null) || [];

				return {
					number: issue.number,
					editedAt: contentEditedAt,
					state: issue.state,
					stateReason: issue.stateReason,
					createdAt: issue.createdAt,
					updatedAt: issue.updatedAt,
					closedAt: issue.closedAt,
					comments,
				};
			})
			.filter((issue) => issue !== null) || [];

	return {
		issues,
		pageInfo: {
			hasNextPage: issuesConnection.pageInfo.hasNextPage,
			endCursor: issuesConnection.pageInfo.endCursor,
		},
	};
}

export async function fetchIssueDetails(
	ctx: FetchContext,
	issueNumber: number,
): Promise<IssueDetails> {
	const result = await ctx.client.query(GetIssueDetailsQuery, {
		owner: ctx.owner,
		repo: ctx.repo,
		number: issueNumber,
	});

	if (result.error) {
		throw result.error;
	}

	const issue = result.data?.repository?.issue;
	if (!issue) {
		throw new Error(`Issue #${issueNumber} not found`);
	}

	const comments: IssueCommentDetails[] = [];
	for (const comment of issue.comments?.nodes || []) {
		if (comment === null) {
			continue;
		}

		comments.push({
			id: comment.id,
			body: comment.body,
			authorType: comment.author?.__typename ?? "Unknown",
		});
	}

	return {
		title: issue.title,
		body: issue.body,
		comments,
	};
}
