import { and, eq, isNotNull, lt, or } from "drizzle-orm";
import {
	db,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import type { TargetGitHubRepository } from "../types";
import { safeParseContentStatusMetadata } from "./content-metadata-schema";

const STALE_THRESHOLD_MINUTES = 15;
const OUTDATED_THRESHOLD_MINUTES = 24 * 60; // 24 hours

/**
 * Fetch GitHub repositories that need to be ingested
 *
 * Target repositories are:
 * - idle
 * - failed and retryAfter has passed
 * - running and updated more than 15 minutes ago (stale)
 * - completed and updated more than 24 hours ago (outdated)
 *
 * @returns Repositories to ingest
 */
export async function fetchIngestTargets(): Promise<TargetGitHubRepository[]> {
	// To prevent the race condition, consider running status as stale if it hasn't been updated for 15 minutes (> 800 seconds)
	const staleThreshold = new Date(
		Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000,
	);
	// To update repository which updated more than 24 hours ago
	const outdatedThreshold = new Date(
		Date.now() - OUTDATED_THRESHOLD_MINUTES * 60 * 1000,
	);
	// Current time for retryAfter comparison
	const now = new Date();

	const records = await db
		.select({
			dbId: githubRepositoryIndex.dbId,
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
			installationId: githubRepositoryIndex.installationId,
			teamDbId: githubRepositoryIndex.teamDbId,
			contentStatus: githubRepositoryContentStatus,
		})
		.from(githubRepositoryIndex)
		.leftJoin(
			githubRepositoryContentStatus,
			eq(
				githubRepositoryContentStatus.repositoryIndexDbId,
				githubRepositoryIndex.dbId,
			),
		)
		.where(
			and(
				eq(githubRepositoryContentStatus.enabled, true),
				or(
					// idle
					eq(githubRepositoryContentStatus.status, "idle"),
					// failed and retryAfter has passed
					and(
						eq(githubRepositoryContentStatus.status, "failed"),
						isNotNull(githubRepositoryContentStatus.retryAfter),
						lt(githubRepositoryContentStatus.retryAfter, now),
					),
					// running and stale
					and(
						eq(githubRepositoryContentStatus.status, "running"),
						lt(githubRepositoryContentStatus.updatedAt, staleThreshold),
					),
					// completed and outdated
					and(
						eq(githubRepositoryContentStatus.status, "completed"),
						lt(githubRepositoryContentStatus.updatedAt, outdatedThreshold),
					),
				),
			),
		);

	return records.map((record) => {
		if (!record.contentStatus) {
			throw new Error(
				`Repository ${record.dbId} does not have a content status`,
			);
		}
		const parseResult = safeParseContentStatusMetadata(
			record.contentStatus.metadata,
			record.contentStatus.contentType,
		);
		if (!parseResult.success) {
			console.warn(
				`Invalid metadata for repository ${record.owner}/${record.repo} (dbId: ${record.dbId}): ${parseResult.error}`,
			);
		}
		const metadata = parseResult.success ? parseResult.data : null;

		return {
			dbId: record.dbId,
			owner: record.owner,
			repo: record.repo,
			installationId: record.installationId,
			lastIngestedCommitSha:
				record.contentStatus.contentType === "blob" && metadata
					? (metadata.lastIngestedCommitSha ?? null)
					: null,
			teamDbId: record.teamDbId,
		};
	});
}
