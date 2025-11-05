import type { GitHubQueryContext } from "@giselles-ai/giselle";
import { githubRepositoryEmbeddings } from "@/db";
import { resolveGitHubRepositoryIndex } from "../resolve-github-repository-index";

/**
 * Context resolver - handles complex DB resolution logic for GitHub blob queries
 */
export async function resolveGitHubEmbeddingFilter(
	context: GitHubQueryContext,
): Promise<Record<string, unknown>> {
	const repositoryIndexDbId = await resolveGitHubRepositoryIndex(context);

	// Return DB-level filters
	return {
		[githubRepositoryEmbeddings.repositoryIndexDbId.name]: repositoryIndexDbId,
	};
}
