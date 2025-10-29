import type { GitHubQueryContext } from "@giselle-sdk/giselle";
import { githubRepositoryIssueEmbeddings } from "@/drizzle";
import { resolveGitHubRepositoryIndex } from "../resolve-github-repository-index";

/**
 * Context resolver - handles complex DB resolution logic for GitHub Issues queries
 */
export async function resolveGitHubIssueEmbeddingFilter(
	context: GitHubQueryContext,
): Promise<Record<string, unknown>> {
	const repositoryIndexDbId = await resolveGitHubRepositoryIndex(context);

	// Return DB-level filters
	return {
		[githubRepositoryIssueEmbeddings.repositoryIndexDbId.name]:
			repositoryIndexDbId,
	};
}
