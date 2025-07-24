import type { GitHubQueryContext } from "@giselle-sdk/giselle";
import { githubRepositoryPullRequestEmbeddings } from "@/drizzle";
import { resolveGitHubRepositoryIndex } from "./shared-resolver";

/**
 * Context resolver - handles complex DB resolution logic for GitHub Pull Request queries
 */
export async function resolveGitHubPullRequestEmbeddingFilter(
	context: GitHubQueryContext,
): Promise<Record<string, unknown>> {
	const repositoryIndexDbId = await resolveGitHubRepositoryIndex(context);

	// Return DB-level filters
	return {
		[githubRepositoryPullRequestEmbeddings.repositoryIndexDbId.name]:
			repositoryIndexDbId,
	};
}
