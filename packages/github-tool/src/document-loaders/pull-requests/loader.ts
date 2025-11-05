import {
	type Document,
	type DocumentLoader,
	DocumentLoaderError,
} from "@giselles-ai/rag";
import { type Client, CombinedError } from "urql";
import { graphql } from "../../client";
import { octokit } from "../../octokit";
import type { GitHubAuthConfig } from "../../types";
import {
	createCacheKey,
	diffsCache,
	type PullRequestDetails,
	prDetailsCache,
} from "./cache";
import {
	type DiffFetchContext,
	type FetchContext,
	fetchDiffs,
	fetchPullRequestDetails,
	fetchPullRequestsMetadata,
} from "./fetchers";
import type {
	GitHubPullRequestMetadata,
	GitHubPullRequestsLoaderConfig,
} from "./types";

const GRAPHQL_BATCH_SIZE = 50; // GitHub GraphQL API optimal batch size

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

	// preserve the original error types for future reference
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

export function createGitHubPullRequestsLoader(
	config: GitHubPullRequestsLoaderConfig,
	authConfig: GitHubAuthConfig,
): DocumentLoader<GitHubPullRequestMetadata> {
	const {
		owner,
		repo,
		perPage = 100,
		maxPages = 10,
		maxContentLength = 1024 * 8, // 8KB limit per content (diff/comment)
	} = config;

	let graphqlClient: Client | null = null;

	async function getGraphQLClient(): Promise<Client> {
		if (!graphqlClient) {
			graphqlClient = await graphql(authConfig);
		}
		return graphqlClient;
	}

	function getPullRequestDetails(
		prNumber: number,
	): Promise<PullRequestDetails> {
		const cached = prDetailsCache.get(prNumber);
		if (cached) {
			return cached;
		}

		const promise = (async () => {
			const client = await getGraphQLClient();
			const ctx: FetchContext = { client, owner, repo };
			return fetchPullRequestDetails(ctx, prNumber);
		})();

		prDetailsCache.set(prNumber, promise);
		promise.catch(() => prDetailsCache.delete(prNumber));
		return promise;
	}

	function getDiffs(prNumber: number): Promise<Map<string, string>> {
		const cacheKey = createCacheKey(owner, repo, prNumber);

		const existingPromise = diffsCache.get(cacheKey);
		if (existingPromise) {
			return existingPromise;
		}

		const promise = (() => {
			const octokitClient = octokit(authConfig);
			const ctx: DiffFetchContext = { octokit: octokitClient, owner, repo };
			return fetchDiffs(ctx, prNumber);
		})();

		diffsCache.set(cacheKey, promise);
		promise.catch(() => {
			diffsCache.delete(cacheKey);
		});
		return promise;
	}

	const loadMetadata =
		async function* (): AsyncIterable<GitHubPullRequestMetadata> {
			const client = await getGraphQLClient();
			const ctx: FetchContext = { client, owner, repo };
			let cursor: string | null = null;
			let pageCount = 0;

			while (pageCount < maxPages) {
				let result: Awaited<ReturnType<typeof fetchPullRequestsMetadata>>;
				try {
					result = await fetchPullRequestsMetadata(ctx, {
						first: Math.min(perPage, GRAPHQL_BATCH_SIZE),
						after: cursor,
					});
				} catch (error) {
					if (error instanceof CombinedError) {
						throw categorizeGitHubGraphqlError(
							error,
							"fetching_pull_requests_metadata",
							{
								owner,
								repo,
							},
						);
					}
					throw DocumentLoaderError.fetchError(
						"github",
						"fetching_pull_requests_metadata",
						error instanceof Error ? error : new Error(String(error)),
						{ owner, repo },
					);
				}

				for (const pr of result.pullRequests) {
					if (!pr.mergedAt) continue;

					yield {
						owner,
						repo,
						prNumber: pr.number,
						contentType: "title_body",
						contentId: "title_body",
						mergedAt: pr.mergedAt,
					};

					for (const commentId of pr.commentIds) {
						yield {
							owner,
							repo,
							prNumber: pr.number,
							contentType: "comment",
							contentId: commentId,
							mergedAt: pr.mergedAt,
						};
					}

					for (const filepath of pr.filePaths) {
						yield {
							owner,
							repo,
							prNumber: pr.number,
							contentType: "diff",
							contentId: filepath,
							mergedAt: pr.mergedAt,
						};
					}
				}

				if (!result.pageInfo.hasNextPage) break;
				cursor = result.pageInfo.endCursor;
				pageCount++;
			}
		};

	const loadDocument = async (
		metadata: GitHubPullRequestMetadata,
	): Promise<Document<GitHubPullRequestMetadata> | null> => {
		const {
			prNumber: pr_number,
			contentType: content_type,
			contentId: content_id,
		} = metadata;

		try {
			switch (content_type) {
				case "title_body": {
					const details = await getPullRequestDetails(pr_number);
					return {
						content: `${details.title}\n\n${details.body || ""}`,
						metadata,
					};
				}

				case "comment": {
					const details = await getPullRequestDetails(pr_number);
					const comment = details.comments.find((c) => c.id === content_id);

					if (
						!comment ||
						comment.authorType === "Bot" ||
						comment.body.length > maxContentLength
					) {
						return null;
					}

					return {
						content: comment.body,
						metadata,
					};
				}

				case "diff": {
					const details = await getPullRequestDetails(pr_number);
					const fileMetadata = details.files.get(content_id);

					if (fileMetadata?.isGenerated || fileMetadata?.isBinary === true) {
						return null;
					}

					const diffs = await getDiffs(pr_number);
					const diff = diffs.get(content_id);

					if (!diff || diff.length > maxContentLength) {
						return null;
					}

					return {
						content: `File: ${content_id}\n\n${diff}`,
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
					`loading_${content_type}_for_pr`,
					{
						owner,
						repo,
						pr_number,
						content_type,
						content_id,
					},
				);
			}
			throw DocumentLoaderError.fetchError(
				"github",
				`loading_${content_type}_for_pr`,
				error instanceof Error ? error : new Error(String(error)),
				{
					owner,
					repo,
					pr_number,
					content_type,
					content_id,
				},
			);
		}
	};

	return { loadMetadata, loadDocument };
}
