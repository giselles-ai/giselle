import {
	type Document,
	type DocumentLoader,
	DocumentLoaderError,
} from "@giselle-sdk/rag";
import { type Client, CombinedError } from "urql";
import { graphql } from "../../client";
import type { GitHubAuthConfig } from "../../types";
import { createCacheKey, issueDetailsCache } from "./cache";
import {
	type FetchContext,
	fetchIssueDetails,
	fetchIssuesMetadata,
} from "./fetchers";
import type {
	GitHubIssueMetadata,
	GitHubIssuesLoaderConfig,
	IssueDetails,
} from "./types";

const GRAPHQL_BATCH_SIZE = 50;
const DEFAULT_CONTENT_LENGTH_LIMIT = 1024 * 8;

/**
 * Categorize GitHub GraphQL errors into appropriate DocumentLoaderError types
 */
function categorizeGitHubGraphqlError(
	error: CombinedError,
	operation: string,
	context: { owner: string; repo: string; [key: string]: unknown },
): DocumentLoaderError {
	if (error.networkError) {
		return DocumentLoaderError.fetchError("github", operation, error, context);
	}

	const errorTypes: string[] = [];
	for (const gqlError of error.graphQLErrors) {
		const originalError = gqlError.originalError;
		if (originalError == null) {
			continue;
		}

		if (
			typeof originalError === "object" &&
			"type" in originalError &&
			typeof originalError.type === "string"
		) {
			errorTypes.push(originalError.type);

			if (originalError.type === "NOT_FOUND") {
				return DocumentLoaderError.notFound(
					`${context.owner}/${context.repo}`,
					error,
					{
						source: "github",
						resourceType: "Repository",
						originalErrorType: originalError.type,
					},
				);
			}
		}
	}

	return DocumentLoaderError.fetchError("github", operation, error, {
		...context,
		errorTypes,
	});
}

export function createGitHubIssuesLoader(
	config: GitHubIssuesLoaderConfig,
	authConfig: GitHubAuthConfig,
): DocumentLoader<GitHubIssueMetadata> {
	const {
		owner,
		repo,
		perPage = 100,
		maxPages = 10,
		maxContentLength = DEFAULT_CONTENT_LENGTH_LIMIT,
	} = config;

	let graphqlClient: Client | null = null;

	async function getGraphQLClient(): Promise<Client> {
		if (!graphqlClient) {
			graphqlClient = await graphql(authConfig);
		}
		return graphqlClient;
	}

	function getIssueDetails(issueNumber: number): Promise<IssueDetails> {
		const cacheKey = createCacheKey(owner, repo, issueNumber);
		const cached = issueDetailsCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		const promise = (async () => {
			const client = await getGraphQLClient();
			const ctx: FetchContext = { client, owner, repo };
			return fetchIssueDetails(ctx, issueNumber);
		})();

		issueDetailsCache.set(cacheKey, promise);
		promise.catch(() => issueDetailsCache.delete(cacheKey));
		return promise;
	}

	const loadMetadata = async function* (): AsyncIterable<GitHubIssueMetadata> {
		const client = await getGraphQLClient();
		const ctx: FetchContext = { client, owner, repo };
		let cursor: string | null = null;
		let pageCount = 0;

		while (pageCount < maxPages) {
			let result: Awaited<ReturnType<typeof fetchIssuesMetadata>>;
			try {
				result = await fetchIssuesMetadata(ctx, {
					first: Math.min(perPage, GRAPHQL_BATCH_SIZE),
					after: cursor,
				});
			} catch (error) {
				if (error instanceof CombinedError) {
					throw categorizeGitHubGraphqlError(
						error,
						"fetching_issues_metadata",
						{ owner, repo },
					);
				}
				throw DocumentLoaderError.fetchError(
					"github",
					"fetching_issues_metadata",
					error instanceof Error ? error : new Error(String(error)),
					{ owner, repo },
				);
			}

			for (const issue of result.issues) {
				yield {
					owner,
					repo,
					issueNumber: issue.number,
					issueState: issue.state,
					issueStateReason: issue.stateReason,
					issueUpdatedAt: issue.updatedAt,
					issueClosedAt: issue.closedAt,
					contentType: "title_body",
					contentId: "title_body",
					contentCreatedAt: issue.createdAt,
					contentEditedAt: issue.editedAt,
				} satisfies GitHubIssueMetadata;

				for (const comment of issue.comments) {
					yield {
						owner,
						repo,
						issueNumber: issue.number,
						issueState: issue.state,
						issueStateReason: issue.stateReason,
						issueUpdatedAt: issue.updatedAt,
						issueClosedAt: issue.closedAt,
						contentType: "comment",
						contentId: comment.id,
						contentCreatedAt: comment.createdAt,
						contentEditedAt: comment.editedAt,
					} satisfies GitHubIssueMetadata;
				}
			}

			if (!result.pageInfo.hasNextPage) {
				break;
			}
			cursor = result.pageInfo.endCursor;
			pageCount++;
		}
	};

	const loadDocument = async (
		metadata: GitHubIssueMetadata,
	): Promise<Document<GitHubIssueMetadata> | null> => {
		const {
			issueNumber,
			contentType,
			contentId,
			issueState,
			issueStateReason,
		} = metadata;

		try {
			switch (contentType) {
				case "title_body": {
					const details = await getIssueDetails(issueNumber);
					const content = `${details.title}\n\n${details.body}`;

					if (content.length === 0) {
						return null;
					}

					if (content.length > maxContentLength) {
						return null;
					}

					return {
						content,
						metadata,
					};
				}

				case "comment": {
					const details = await getIssueDetails(issueNumber);
					const comment = details.comments.find((c) => c.id === contentId);

					if (!comment) {
						return null;
					}

					if (comment.authorType === "Bot") {
						return null;
					}

					if (
						comment.body.length === 0 ||
						comment.body.length > maxContentLength
					) {
						return null;
					}

					return {
						content: comment.body,
						metadata,
					};
				}

				default:
					return null;
			}
		} catch (error) {
			if (error instanceof CombinedError) {
				throw categorizeGitHubGraphqlError(
					error,
					`loading_${contentType}_for_issue`,
					{
						owner,
						repo,
						issue_number: issueNumber,
						content_type: contentType,
						content_id: contentId,
						issue_state: issueState,
						issue_state_reason: issueStateReason,
					},
				);
			}
			throw DocumentLoaderError.fetchError(
				"github",
				`loading_${contentType}_for_issue`,
				error instanceof Error ? error : new Error(String(error)),
				{
					owner,
					repo,
					issue_number: issueNumber,
					content_type: contentType,
					content_id: contentId,
					issue_tate: issueState,
					issue_state_reason: issueStateReason,
				},
			);
		}
	};

	return { loadMetadata, loadDocument };
}
