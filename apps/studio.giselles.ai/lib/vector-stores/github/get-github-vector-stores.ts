import { and, eq } from "drizzle-orm";
import {
	db,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";

export async function getGitHubVectorStores(teamDbId: number) {
	const vectorStores = await db
		.select({
			id: githubRepositoryIndex.id,
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
		})
		.from(githubRepositoryIndex)
		.innerJoin(
			githubRepositoryContentStatus,
			and(
				eq(
					githubRepositoryContentStatus.repositoryIndexDbId,
					githubRepositoryIndex.dbId,
				),
				// currently only support blob content type
				// TODO: support pull requests
				eq(githubRepositoryContentStatus.contentType, "blob"),
			),
		)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, teamDbId),
				eq(githubRepositoryContentStatus.status, "completed"),
				eq(githubRepositoryContentStatus.enabled, true),
			),
		);
	return vectorStores.map((vectorStore) => ({
		id: vectorStore.id,
		name: `${vectorStore.owner}/${vectorStore.repo}`,
		reference: {
			provider: "github" as const,
			owner: vectorStore.owner,
			repo: vectorStore.repo,
		},
	}));
}
