import { and, eq } from "drizzle-orm";
import { db, githubRepositoryContentStatus, githubRepositoryIndex } from "@/db";

type ContentType = {
	contentType: "blob" | "pull_request" | "issue";
	embeddingProfileIds: number[];
};

type GitHubRepositoryIndex = {
	id: string;
	name: string;
	owner: string;
	repo: string;
	contentTypes: ContentType[];
};

export async function getGitHubRepositoryIndexes(
	teamDbId: number,
): Promise<GitHubRepositoryIndex[]> {
	const repositories = await db
		.select({
			id: githubRepositoryIndex.id,
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
			contentType: githubRepositoryContentStatus.contentType,
			embeddingProfileId: githubRepositoryContentStatus.embeddingProfileId,
		})
		.from(githubRepositoryIndex)
		.innerJoin(
			githubRepositoryContentStatus,
			eq(
				githubRepositoryContentStatus.repositoryIndexDbId,
				githubRepositoryIndex.dbId,
			),
		)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, teamDbId),
				eq(githubRepositoryContentStatus.status, "completed"),
				eq(githubRepositoryContentStatus.enabled, true),
			),
		);

	// Group by repository and collect content types with embedding profiles
	const repoMap = new Map<
		string,
		{
			id: string;
			name: string;
			owner: string;
			repo: string;
			contentTypeToProfiles: Map<
				"blob" | "pull_request" | "issue",
				Set<number>
			>;
		}
	>();

	for (const row of repositories) {
		const key = `${row.owner}/${row.repo}`;
		let acc = repoMap.get(key);
		if (!acc) {
			acc = {
				id: row.id,
				name: key,
				owner: row.owner,
				repo: row.repo,
				contentTypeToProfiles: new Map(),
			};
			repoMap.set(key, acc);
		}

		const set =
			acc.contentTypeToProfiles.get(row.contentType) ?? new Set<number>();
		set.add(row.embeddingProfileId);
		if (!acc.contentTypeToProfiles.has(row.contentType)) {
			acc.contentTypeToProfiles.set(row.contentType, set);
		}
	}

	return Array.from(repoMap.values()).map((r) => ({
		id: r.id,
		name: r.name,
		owner: r.owner,
		repo: r.repo,
		contentTypes: Array.from(r.contentTypeToProfiles.entries()).map(
			([contentType, ids]) => ({
				contentType,
				embeddingProfileIds: Array.from(ids),
			}),
		),
	}));
}
