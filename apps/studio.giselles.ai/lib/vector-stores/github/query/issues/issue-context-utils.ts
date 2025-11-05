import type { GitHubQueryContext } from "@giselles-ai/giselle";
import type { QueryResult } from "@giselles-ai/rag";
import { and, eq, inArray } from "drizzle-orm";
import { db, githubRepositoryIssueEmbeddings } from "@/db";
import { resolveGitHubRepositoryIndex } from "../resolve-github-repository-index";
import type { GitHubIssueMetadata } from "./schema";

/**
 * Adds Issue context to query results for comment chunks
 */
export async function addIssueContextToResults(
	results: QueryResult<GitHubIssueMetadata>[],
	context: GitHubQueryContext,
): Promise<QueryResult<GitHubIssueMetadata>[]> {
	// Find Issue numbers that need context (comment chunks)
	const issueNumbersNeedingContext: number[] = [
		...new Set(
			results
				.filter((r) => r.metadata.contentType !== "title_body")
				.map((r) => r.metadata.issueNumber),
		),
	];
	if (issueNumbersNeedingContext.length === 0) {
		return results;
	}

	const repositoryIndexDbId = await resolveGitHubRepositoryIndex(context);
	const issueContextMap = await fetchIssueContexts(
		repositoryIndexDbId,
		issueNumbersNeedingContext,
	);
	return results.map((result) => {
		// if the content type is title_body, we don't need to add context
		if (result.metadata.contentType === "title_body") {
			return result;
		}

		const context = issueContextMap.get(result.metadata.issueNumber);
		if (context) {
			return {
				...result,
				additional: { issueContext: context.content },
			};
		}
		return result;
	});
}

async function fetchIssueContexts(
	repositoryIndexDbId: number,
	issueNumbers: number[],
): Promise<Map<number, { content: string }>> {
	const issueContexts = await db
		.select({
			issueNumber: githubRepositoryIssueEmbeddings.issueNumber,
			content: githubRepositoryIssueEmbeddings.chunkContent,
		})
		.from(githubRepositoryIssueEmbeddings)
		.where(
			and(
				eq(
					githubRepositoryIssueEmbeddings.repositoryIndexDbId,
					repositoryIndexDbId,
				),
				eq(githubRepositoryIssueEmbeddings.contentType, "title_body"),
				inArray(githubRepositoryIssueEmbeddings.issueNumber, issueNumbers),
			),
		);

	const issueContextMap = new Map<number, { content: string }>();
	for (const context of issueContexts) {
		issueContextMap.set(context.issueNumber, {
			content: context.content,
		});
	}

	return issueContextMap;
}
