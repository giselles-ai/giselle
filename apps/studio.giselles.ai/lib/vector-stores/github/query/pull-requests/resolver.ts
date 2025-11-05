import type { GitHubQueryContext } from "@giselles-ai/giselle";
import { githubRepositoryPullRequestEmbeddings } from "@/db";
import { resolveGitHubRepositoryIndex } from "../resolve-github-repository-index";

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
