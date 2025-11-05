import type { GitHubQueryContext } from "@giselles-ai/giselle";
import type { QueryResult } from "@giselles-ai/rag";
import { and, eq, inArray } from "drizzle-orm";
import { db, githubRepositoryPullRequestEmbeddings } from "@/db";
import { resolveGitHubRepositoryIndex } from "../resolve-github-repository-index";
import type { GitHubPullRequestMetadata } from "./schema";

/**
 * Adds PR context to query results for comment/diff chunks
 */
export async function addPRContextToResults(
	results: QueryResult<GitHubPullRequestMetadata>[],
	context: GitHubQueryContext,
): Promise<QueryResult<GitHubPullRequestMetadata>[]> {
	// Find PR numbers that need context (comment/diff chunks)
	const prNumbersNeedingContext: number[] = [
		...new Set(
			results
				.filter((r) => r.metadata.contentType !== "title_body")
				.map((r) => r.metadata.prNumber),
		),
	];
	if (prNumbersNeedingContext.length === 0) {
		return results;
	}

	const repositoryIndexDbId = await resolveGitHubRepositoryIndex(context);
	const prContextMap = await fetchPRContexts(
		repositoryIndexDbId,
		prNumbersNeedingContext,
	);
	return results.map((result) => {
		// if the content type is title_body, we don't need to add context
		if (result.metadata.contentType === "title_body") {
			return result;
		}

		const context = prContextMap.get(result.metadata.prNumber);
		if (context) {
			return {
				...result,
				additional: { prContext: context.content },
			};
		}
		return result;
	});
}

async function fetchPRContexts(
	repositoryIndexDbId: number,
	prNumbers: number[],
): Promise<Map<number, { content: string }>> {
	const prContexts = await db
		.select({
			prNumber: githubRepositoryPullRequestEmbeddings.prNumber,
			content: githubRepositoryPullRequestEmbeddings.chunkContent,
		})
		.from(githubRepositoryPullRequestEmbeddings)
		.where(
			and(
				eq(
					githubRepositoryPullRequestEmbeddings.repositoryIndexDbId,
					repositoryIndexDbId,
				),
				eq(githubRepositoryPullRequestEmbeddings.contentType, "title_body"),
				inArray(githubRepositoryPullRequestEmbeddings.prNumber, prNumbers),
			),
		);

	const prContextMap = new Map<number, { content: string }>();
	for (const context of prContexts) {
		prContextMap.set(context.prNumber, {
			content: context.content,
		});
	}

	return prContextMap;
}
