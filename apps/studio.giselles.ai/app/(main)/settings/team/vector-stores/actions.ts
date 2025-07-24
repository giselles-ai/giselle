"use server";

import { createId } from "@paralleldrive/cuid2";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import {
	db,
	type GitHubRepositoryContentType,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import {
	processRepository,
	type RepositoryWithStatuses,
} from "@/lib/vector-stores/github";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { getGitHubIdentityState } from "@/services/accounts";
import { buildAppInstallationClient } from "@/services/external/github";
import { fetchCurrentTeam } from "@/services/teams";
import type { ActionResult, DiagnosticResult } from "./types";

type IngestabilityCheck = {
	canIngest: boolean;
	reason?: string;
};

export async function registerRepositoryIndex(
	owner: string,
	repo: string,
	installationId: number,
	contentTypes?: {
		contentType: GitHubRepositoryContentType;
		enabled: boolean;
	}[],
): Promise<ActionResult> {
	try {
		const team = await fetchCurrentTeam();

		// check if the user have access to the installation
		// FIXME: When the installation is managed by the team, we should use the team's installation instead
		const githubIdentityState = await getGitHubIdentityState();
		if (githubIdentityState.status !== "authorized") {
			return {
				success: false,
				error: "GitHub account authentication is required",
			};
		}
		const userClient = githubIdentityState.gitHubUserClient;
		const installationData = await userClient.getInstallations();
		const installation = installationData.installations.find(
			(installation) => installation.id === installationId,
		);
		if (!installation) {
			return { success: false, error: "Installation not found" };
		}

		// check if the installation can access the repository
		const installationClient = await buildAppInstallationClient(installationId);

		// check if the repository is already registered
		const repository = await installationClient.request(
			"GET /repos/{owner}/{repo}",
			{
				owner,
				repo,
			},
		);
		if (repository.status !== 200) {
			return { success: false, error: "Repository not found" };
		}

		// Check if the repository is already registered for this team
		const existingIndex = await db
			.select()
			.from(githubRepositoryIndex)
			.where(
				and(
					eq(githubRepositoryIndex.owner, owner),
					eq(githubRepositoryIndex.repo, repo),
					eq(githubRepositoryIndex.teamDbId, team.dbId),
				),
			)
			.limit(1);

		if (existingIndex.length > 0) {
			return {
				success: false,
				error: `Repository ${owner}/${repo} is already registered for this team`,
			};
		}

		const newIndexId = `gthbi_${createId()}` as GitHubRepositoryIndexId;
		const [newRepository] = await db
			.insert(githubRepositoryIndex)
			.values({
				id: newIndexId,
				owner,
				repo,
				teamDbId: team.dbId,
				installationId,
			})
			.returning({ dbId: githubRepositoryIndex.dbId });

		// Default content types if not provided
		const defaultContentTypes: {
			contentType: GitHubRepositoryContentType;
			enabled: boolean;
		}[] = [
			{ contentType: "blob", enabled: true },
			{ contentType: "pull_request", enabled: true },
		];

		const contentTypesToCreate = contentTypes || defaultContentTypes;

		// Ensure blob is always enabled
		const hasBlobEnabled = contentTypesToCreate.some(
			(ct) => ct.contentType === "blob" && ct.enabled,
		);
		if (!hasBlobEnabled) {
			// Force blob to be enabled
			const blobIndex = contentTypesToCreate.findIndex(
				(ct) => ct.contentType === "blob",
			);
			if (blobIndex >= 0) {
				contentTypesToCreate[blobIndex].enabled = true;
			} else {
				contentTypesToCreate.push({ contentType: "blob", enabled: true });
			}
		}

		// Create content status records
		for (const contentType of contentTypesToCreate) {
			await db.insert(githubRepositoryContentStatus).values({
				repositoryIndexDbId: newRepository.dbId,
				contentType: contentType.contentType,
				enabled: contentType.enabled,
				status: "idle",
			});
		}

		revalidatePath("/settings/team/vector-stores");
		return { success: true };
	} catch (error) {
		console.error("Error registering repository index:", error);
		return {
			success: false,
			error: "An error occurred while registering the repository",
		};
	}
}

export async function deleteRepositoryIndex(indexId: GitHubRepositoryIndexId) {
	const team = await fetchCurrentTeam();
	await db
		.delete(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, team.dbId),
				eq(githubRepositoryIndex.id, indexId),
			),
		);
	revalidatePath("/settings/team/vector-stores");
}

export async function diagnoseRepositoryConnection(
	indexId: GitHubRepositoryIndexId,
): Promise<DiagnosticResult> {
	try {
		const team = await fetchCurrentTeam();

		const [repositoryIndex] = await db
			.select()
			.from(githubRepositoryIndex)
			.where(
				and(
					eq(githubRepositoryIndex.teamDbId, team.dbId),
					eq(githubRepositoryIndex.id, indexId),
				),
			)
			.limit(1);

		if (!repositoryIndex) {
			return {
				canBeFixed: false,
				reason: "repository-not-found",
				errorMessage: "Repository index not found",
			};
		}

		const githubIdentityState = await getGitHubIdentityState();
		if (githubIdentityState.status !== "authorized") {
			return {
				canBeFixed: false,
				reason: "diagnosis-failed",
				errorMessage: "GitHub authentication required",
			};
		}

		const userClient = githubIdentityState.gitHubUserClient;
		const installationData = await userClient.getInstallations();

		let validInstallationId: number | null = null;
		for (const installation of installationData.installations) {
			try {
				const installationClient = await buildAppInstallationClient(
					installation.id,
				);
				const response = await installationClient.request(
					"GET /repos/{owner}/{repo}",
					{
						owner: repositoryIndex.owner,
						repo: repositoryIndex.repo,
					},
				);

				if (response.status === 200) {
					validInstallationId = installation.id;
					break;
				}
			} catch (_error) {}
		}

		if (!validInstallationId) {
			return {
				canBeFixed: false,
				reason: "no-installation",
				errorMessage:
					"No GitHub App installation has access to this repository",
			};
		}

		return {
			canBeFixed: true,
			newInstallationId: validInstallationId,
		};
	} catch (error) {
		console.error("Error diagnosing repository connection:", error);
		return {
			canBeFixed: false,
			reason: "diagnosis-failed",
			errorMessage: "Failed to diagnose the connection issue",
		};
	}
}

export async function updateRepositoryInstallation(
	indexId: GitHubRepositoryIndexId,
	newInstallationId: number,
): Promise<void> {
	const team = await fetchCurrentTeam();

	await db
		.update(githubRepositoryIndex)
		.set({
			installationId: newInstallationId,
		})
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, team.dbId),
				eq(githubRepositoryIndex.id, indexId),
			),
		);

	const [repository] = await db
		.select({ dbId: githubRepositoryIndex.dbId })
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, team.dbId),
				eq(githubRepositoryIndex.id, indexId),
			),
		)
		.limit(1);

	if (repository) {
		await db
			.update(githubRepositoryContentStatus)
			.set({
				status: "idle",
				errorCode: null,
				retryAfter: null,
			})
			.where(
				eq(githubRepositoryContentStatus.repositoryIndexDbId, repository.dbId),
				// we don't have to watch content type because we are updating the whole contents for the repository
			);
	}

	revalidatePath("/settings/team/vector-stores");
}

/**
 * Trigger a manual ingest for a GitHub repository index if it is eligible.
 */
export async function triggerManualIngest(
	indexId: GitHubRepositoryIndexId,
): Promise<ActionResult> {
	try {
		const team = await fetchCurrentTeam();

		const repositoryData = await fetchRepositoryWithStatuses(
			indexId,
			team.dbId,
		);
		if (!repositoryData) {
			return {
				success: false,
				error: "Repository not found",
			};
		}

		const ingestCheck = checkIngestability(repositoryData.contentStatuses);
		if (!ingestCheck.canIngest) {
			return {
				success: false,
				error: ingestCheck.reason || "Cannot ingest repository",
			};
		}

		executeManualIngest(repositoryData);

		// Immediately revalidate to show "running" status
		revalidatePath("/settings/team/vector-stores");

		return { success: true };
	} catch (error) {
		console.error("Error triggering manual ingest:", error);
		return {
			success: false,
			error: "Failed to trigger manual ingest",
		};
	}
}

/**
 * Fetch repository with all its content statuses
 */
async function fetchRepositoryWithStatuses(
	repositoryIndexId: GitHubRepositoryIndexId,
	teamDbId: number,
): Promise<RepositoryWithStatuses | null> {
	const repositoryIndexResult = await db
		.select()
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.id, repositoryIndexId),
				eq(githubRepositoryIndex.teamDbId, teamDbId),
			),
		);
	if (repositoryIndexResult.length === 0) {
		return null;
	}
	const repositoryIndex = repositoryIndexResult[0];

	const contentStatuses = await db
		.select()
		.from(githubRepositoryContentStatus)
		.where(
			eq(
				githubRepositoryContentStatus.repositoryIndexDbId,
				repositoryIndex.dbId,
			),
		);
	return { repositoryIndex, contentStatuses };
}

/**
 * Check if repository can be ingested based on content statuses
 */
function checkIngestability(
	contentStatuses: (typeof githubRepositoryContentStatus.$inferSelect)[],
	now: Date = new Date(),
): IngestabilityCheck {
	for (const contentStatus of contentStatuses) {
		if (!contentStatus.enabled) {
			continue;
		}

		const canIngestThis =
			contentStatus.status === "idle" ||
			contentStatus.status === "completed" ||
			(contentStatus.status === "failed" &&
				contentStatus.retryAfter &&
				contentStatus.retryAfter <= now);

		if (!canIngestThis) {
			return {
				canIngest: false,
				reason: `Repository cannot be ingested at this time (${contentStatus.contentType} is blocking)`,
			};
		}
	}

	const hasBlobStatus = contentStatuses.some((cs) => cs.contentType === "blob");
	if (!hasBlobStatus) {
		return {
			canIngest: false,
			reason: "Repository does not have a blob content status",
		};
	}

	return { canIngest: true };
}

/**
 * Execute manual ingest for a repository
 */
function executeManualIngest(repositoryData: RepositoryWithStatuses): void {
	after(async () => {
		await processRepository(repositoryData);
	});
}

/**
 * Update content type configurations for a repository
 */
export async function updateRepositoryContentTypes(
	repositoryIndexId: string,
	contentTypes: {
		contentType: GitHubRepositoryContentType;
		enabled: boolean;
	}[],
): Promise<ActionResult> {
	try {
		const team = await fetchCurrentTeam();

		// Verify the repository belongs to the team
		const [repository] = await db
			.select({ dbId: githubRepositoryIndex.dbId })
			.from(githubRepositoryIndex)
			.where(
				and(
					eq(
						githubRepositoryIndex.id,
						repositoryIndexId as GitHubRepositoryIndexId,
					),
					eq(githubRepositoryIndex.teamDbId, team.dbId),
				),
			)
			.limit(1);

		if (!repository) {
			return {
				success: false,
				error: "Repository not found",
			};
		}

		// Validate that code (blob) is always enabled
		const blobConfig = contentTypes.find((ct) => ct.contentType === "blob");
		if (blobConfig && !blobConfig.enabled) {
			return {
				success: false,
				error: "Code content type must remain enabled",
			};
		}

		// Update or create content status records using single upsert
		await db
			.insert(githubRepositoryContentStatus)
			.values(
				contentTypes.map((contentType) => ({
					repositoryIndexDbId: repository.dbId,
					contentType: contentType.contentType,
					enabled: contentType.enabled,
					status: "idle" as const,
				})),
			)
			.onConflictDoUpdate({
				target: [
					githubRepositoryContentStatus.repositoryIndexDbId,
					githubRepositoryContentStatus.contentType,
				],
				set: {
					enabled: sql`excluded.enabled`,
					updatedAt: new Date(),
				},
			});

		revalidatePath("/settings/team/vector-stores");
		return { success: true };
	} catch (error) {
		console.error("Error updating repository content types:", error);
		return {
			success: false,
			error: "Failed to update content types",
		};
	}
}
