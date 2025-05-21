import { db, githubRepositoryIndex } from "@/drizzle";
import { and, eq } from "drizzle-orm";

export async function getGitHubVectorStores(teamDbId: number) {
	const vectorStores = await db
		.select({
			id: githubRepositoryIndex.id,
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
		})
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, teamDbId),
				eq(githubRepositoryIndex.status, "completed"),
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
