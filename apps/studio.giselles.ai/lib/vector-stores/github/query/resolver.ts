import type { GitHubQueryContext } from "@giselle-sdk/giselle";
import { githubRepositoryEmbeddings } from "@/drizzle";
import { resolveGitHubRepositoryIndex } from "./shared-resolver";

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
