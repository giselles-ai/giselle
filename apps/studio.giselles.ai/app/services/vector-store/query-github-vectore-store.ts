import {
	agents,
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
	teams,
} from "@/drizzle";
import type { GitHubVectorStoreQueryFunctionParams } from "@giselle-sdk/giselle-engine";
import { and, cosineDistance, desc, eq, gte, sql } from "drizzle-orm";

export async function queryGithubVectorStore(
	params: GitHubVectorStoreQueryFunctionParams,
) {
	const {
		embedding,
		limit,
		similarityThreshold,
		filters: { workspaceId, owner, repo },
	} = params;

	const records = await db
		.select({
			dbId: teams.dbId,
		})
		.from(teams)
		.innerJoin(agents, eq(agents.workspaceId, workspaceId))
		.where(eq(teams.dbId, agents.teamDbId))
		.limit(1);

	if (records.length === 0) {
		throw new Error("Team not found");
	}
	const teamDbId = records[0].dbId;

	const repositoryIndex = await db
		.select({
			dbId: githubRepositoryIndex.dbId,
		})
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, teamDbId),
				eq(githubRepositoryIndex.owner, owner),
				eq(githubRepositoryIndex.repo, repo),
			),
		)
		.limit(1);

	if (repositoryIndex.length === 0) {
		throw new Error("Repository index not found");
	}
	const repositoryIndexDbId = repositoryIndex[0].dbId;

	const similarity = sql<number>`1 - (${cosineDistance(
		githubRepositoryEmbeddings.embedding,
		embedding,
	)})`;
	const results = await db
		.select({
			chunkContent: githubRepositoryEmbeddings.chunkContent,
			chunkIndex: githubRepositoryEmbeddings.chunkIndex,
			commitSha: githubRepositoryEmbeddings.commitSha,
			fileSha: githubRepositoryEmbeddings.fileSha,
			path: githubRepositoryEmbeddings.path,
			nodeId: githubRepositoryEmbeddings.nodeId,
			similarity,
		})
		.from(githubRepositoryEmbeddings)
		.where(
			and(
				gte(similarity, similarityThreshold),
				eq(githubRepositoryEmbeddings.repositoryIndexDbId, repositoryIndexDbId),
			),
		)
		.orderBy(desc(similarity))
		.limit(limit);

	return results.map((result) => ({
		chunk: {
			content: result.chunkContent,
			index: result.chunkIndex,
		},
		metadata: {
			commitSha: result.commitSha,
			fileSha: result.fileSha,
			path: result.path,
			nodeId: result.nodeId,
		},
		score: result.similarity,
	}));
}
