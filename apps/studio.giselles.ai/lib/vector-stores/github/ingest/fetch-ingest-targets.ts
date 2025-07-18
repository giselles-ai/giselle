import { and, eq, isNotNull, lt, or } from "drizzle-orm";
import {
	db,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import type { RepositoryWithStatuses } from "../shared-types";

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
export async function fetchIngestTargets(): Promise<RepositoryWithStatuses[]> {
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

	// First, get all repositories with their content statuses
	const repositories = await db
		.select({
			repository: githubRepositoryIndex,
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
					eq(githubRepositoryContentStatus.status, "idle"),
					and(
						eq(githubRepositoryContentStatus.status, "failed"),
						isNotNull(githubRepositoryContentStatus.retryAfter),
						lt(githubRepositoryContentStatus.retryAfter, now),
					),
					and(
						eq(githubRepositoryContentStatus.status, "running"),
						lt(githubRepositoryContentStatus.updatedAt, staleThreshold),
					),
					and(
						eq(githubRepositoryContentStatus.status, "completed"),
						lt(githubRepositoryContentStatus.updatedAt, outdatedThreshold),
					),
				),
			),
		);

	// Group by repository
	const repositoryMap = new Map<number, RepositoryWithStatuses>();

	for (const record of repositories) {
		const { repository, contentStatus } = record;

		if (!repositoryMap.has(repository.dbId)) {
			repositoryMap.set(repository.dbId, {
				repository,
				contentStatuses: [],
			});
		}

		if (contentStatus) {
			const repo = repositoryMap.get(repository.dbId);
			if (repo) {
				repo.contentStatuses.push(contentStatus);
			}
		}
	}

	return Array.from(repositoryMap.values());
}
