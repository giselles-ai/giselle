import type { EmbeddingProfileId } from "@giselle-sdk/rag";
import { eq } from "drizzle-orm";
import { db, githubRepositoryEmbeddingProfiles } from "@/drizzle";

/**
 * Get enabled embedding profiles for a repository
 */
export async function getEnabledEmbeddingProfiles(
	repositoryIndexDbId: number,
): Promise<EmbeddingProfileId[]> {
	const profiles = await db
		.select()
		.from(githubRepositoryEmbeddingProfiles)
		.where(
			eq(
				githubRepositoryEmbeddingProfiles.repositoryIndexDbId,
				repositoryIndexDbId,
			),
		);

	return profiles.map((p) => p.embeddingProfileId);
}
