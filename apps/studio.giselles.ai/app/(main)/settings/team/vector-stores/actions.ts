"use server";

import {
	DEFAULT_EMBEDDING_PROFILE_ID,
	EMBEDDING_PROFILES,
	type EmbeddingProfileId,
	isEmbeddingProfileId,
} from "@giselle-sdk/data-type";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import {
	db,
	documentEmbeddingProfiles,
	documentVectorStores,
	type GitHubRepositoryContentType,
	githubRepositoryContentStatus,
	githubRepositoryEmbeddingProfiles,
	githubRepositoryIndex,
} from "@/drizzle";
import { docVectorStoreFlag } from "@/flags";
import {
	createManualIngestTrigger,
	type IngestTrigger,
	processRepository,
	type RepositoryWithStatuses,
} from "@/lib/vector-stores/github";
import type {
	DocumentVectorStoreId,
	GitHubRepositoryIndexId,
} from "@/packages/types";
import { fetchCurrentUser, getGitHubIdentityState } from "@/services/accounts";
import { buildAppInstallationClient } from "@/services/external/github";
import { fetchCurrentTeam } from "@/services/teams";
import type { ActionResult, DiagnosticResult } from "./types";

type IngestabilityCheck = {
	canIngest: boolean;
	reason?: string;
};

async function validateGitHubAccess(
	installationId: number,
	owner: string,
	repo: string,
): Promise<{ success: true } | { success: false; error: string }> {
	try {
		// Check if the user has access to the installation
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

		// Check if the installation can access the repository
		const installationClient = await buildAppInstallationClient(installationId);
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

		return { success: true };
	} catch (error) {
		console.error("GitHub access validation failed:", error);
		return { success: false, error: "Failed to validate GitHub access" };
	}
}

export async function registerRepositoryIndex(
	owner: string,
	repo: string,
	installationId: number,
	contentTypes: {
		contentType: GitHubRepositoryContentType;
		enabled: boolean;
	}[],
	embeddingProfileIds?: number[],
): Promise<ActionResult> {
	// Ensure blob is always enabled
	const hasEnabledBlob = contentTypes.some(
		(ct) => ct.contentType === "blob" && ct.enabled,
	);
	if (!hasEnabledBlob) {
		contentTypes = [
			...contentTypes.filter((ct) => ct.contentType !== "blob"),
			{ contentType: "blob", enabled: true },
		];
	}

	const profilesToCreate = embeddingProfileIds || [
		DEFAULT_EMBEDDING_PROFILE_ID,
	];
	const validProfileIds = profilesToCreate.filter(isEmbeddingProfileId);
	if (validProfileIds.length === 0) {
		return {
			success: false,
			error: "At least one valid embedding profile is required",
		};
	}

	const accessValidation = await validateGitHubAccess(
		installationId,
		owner,
		repo,
	);
	if (!accessValidation.success) {
		return accessValidation;
	}

	try {
		const team = await fetchCurrentTeam();
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
		await db.transaction(async (tx) => {
			const [newRepository] = await tx
				.insert(githubRepositoryIndex)
				.values({
					id: newIndexId,
					owner,
					repo,
					teamDbId: team.dbId,
					installationId,
				})
				.returning({ dbId: githubRepositoryIndex.dbId });

			const embeddingProfilesData = validProfileIds.map((profileId) => ({
				repositoryIndexDbId: newRepository.dbId,
				embeddingProfileId: profileId,
				createdAt: new Date(),
			}));
			await tx
				.insert(githubRepositoryEmbeddingProfiles)
				.values(embeddingProfilesData);

			const contentStatusData = validProfileIds.flatMap((profileId) =>
				contentTypes.map((contentType) => ({
					repositoryIndexDbId: newRepository.dbId,
					embeddingProfileId: profileId,
					contentType: contentType.contentType,
					enabled: contentType.enabled,
					status: "idle" as const,
				})),
			);
			await tx.insert(githubRepositoryContentStatus).values(contentStatusData);
		});

		revalidatePath("/settings/team/vector-stores");
		return { success: true };
	} catch (error) {
		console.error("Failed to register repository:", error);

		return {
			success: false,
			error: "Failed to register repository. Please try again.",
		};
	}
}

/**
 * Update repository index including content types and embedding profiles
 * This unified function handles both settings in a single transaction for consistency
 */
export async function updateRepositoryIndex(
	repositoryIndexId: GitHubRepositoryIndexId,
	contentTypes: {
		contentType: GitHubRepositoryContentType;
		enabled: boolean;
	}[],
	embeddingProfileIds?: number[],
): Promise<ActionResult> {
	const blobConfig = contentTypes.find((ct) => ct.contentType === "blob");
	if (blobConfig && !blobConfig.enabled) {
		return {
			success: false,
			error: "Code content type must remain enabled",
		};
	}

	const profilesToUpdate = embeddingProfileIds || [
		DEFAULT_EMBEDDING_PROFILE_ID,
	];
	const validProfileIds = profilesToUpdate.filter(isEmbeddingProfileId);
	if (validProfileIds.length === 0) {
		return {
			success: false,
			error: "At least one valid embedding profile is required",
		};
	}

	try {
		const team = await fetchCurrentTeam();

		const [repository] = await db
			.select()
			.from(githubRepositoryIndex)
			.where(
				and(
					eq(githubRepositoryIndex.id, repositoryIndexId),
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

		await db.transaction(async (tx) => {
			// Clean up profiles and statuses that are no longer needed
			// Get existing profiles to determine what to delete
			const existingProfiles = await tx
				.select({
					embeddingProfileId:
						githubRepositoryEmbeddingProfiles.embeddingProfileId,
				})
				.from(githubRepositoryEmbeddingProfiles)
				.for("update")
				.where(
					eq(
						githubRepositoryEmbeddingProfiles.repositoryIndexDbId,
						repository.dbId,
					),
				);

			const profilesToRemove = existingProfiles
				.map((p) => p.embeddingProfileId)
				.filter((id) => !validProfileIds.includes(id));

			// Delete removed profiles and their content statuses
			if (profilesToRemove.length > 0) {
				await tx
					.delete(githubRepositoryEmbeddingProfiles)
					.where(
						and(
							eq(
								githubRepositoryEmbeddingProfiles.repositoryIndexDbId,
								repository.dbId,
							),
							inArray(
								githubRepositoryEmbeddingProfiles.embeddingProfileId,
								profilesToRemove,
							),
						),
					);
				await tx
					.delete(githubRepositoryContentStatus)
					.where(
						and(
							eq(
								githubRepositoryContentStatus.repositoryIndexDbId,
								repository.dbId,
							),
							inArray(
								githubRepositoryContentStatus.embeddingProfileId,
								profilesToRemove,
							),
						),
					);
			}

			// Upsert embedding profiles
			if (validProfileIds.length > 0) {
				const embeddingProfilesData = validProfileIds.map((profileId) => ({
					repositoryIndexDbId: repository.dbId,
					embeddingProfileId: profileId,
					createdAt: new Date(),
				}));

				await tx
					.insert(githubRepositoryEmbeddingProfiles)
					.values(embeddingProfilesData)
					.onConflictDoNothing();
			}

			// Upsert content statuses
			if (validProfileIds.length > 0 && contentTypes.length > 0) {
				const contentStatusData = validProfileIds.flatMap((profileId) =>
					contentTypes.map((contentType) => ({
						repositoryIndexDbId: repository.dbId,
						embeddingProfileId: profileId,
						contentType: contentType.contentType,
						enabled: contentType.enabled,
						status: "idle" as const,
					})),
				);

				await tx
					.insert(githubRepositoryContentStatus)
					.values(contentStatusData)
					.onConflictDoUpdate({
						target: [
							githubRepositoryContentStatus.repositoryIndexDbId,
							githubRepositoryContentStatus.embeddingProfileId,
							githubRepositoryContentStatus.contentType,
						],
						set: {
							enabled: sql`excluded.enabled`,
							// Preserve existing status, errorCode, retryAfter
						},
					});
			}
		});

		revalidatePath("/settings/team/vector-stores");
		return { success: true };
	} catch (error) {
		console.error("Error updating repository settings:", error);
		return {
			success: false,
			error: "Failed to update repository settings",
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
					"No GitHub App installation has access to this repository. Please review your installation from the Integrations page.",
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
				// we don't have to watch content type or embedding profile because we are updating the whole contents for the repository
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
		const user = await fetchCurrentUser();

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
		const trigger = createManualIngestTrigger(user.id);
		executeManualIngest(repositoryData, trigger);

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

export async function createDocumentVectorStore(
	name: string,
	embeddingProfileIds: number[],
): Promise<ActionResult> {
	const enabled = await docVectorStoreFlag();
	if (!enabled) {
		return { success: false, error: "Feature disabled" };
	}
	const trimmedName = name.trim();
	if (trimmedName.length === 0) {
		return { success: false, error: "Name is required" };
	}
	// Validate provided embedding profiles: non-empty and Cohere-only
	if (!Array.isArray(embeddingProfileIds) || embeddingProfileIds.length === 0) {
		return { success: false, error: "Select at least one embedding profile" };
	}
	for (const id of embeddingProfileIds) {
		if (!isEmbeddingProfileId(id)) {
			return { success: false, error: `Invalid embedding profile id: ${id}` };
		}
		const p = EMBEDDING_PROFILES[id];
		if (p.provider !== "cohere") {
			return {
				success: false,
				error: "Only Cohere profiles are supported for Document Vector Stores",
			};
		}
	}
	try {
		const team = await fetchCurrentTeam();
		const documentVectorStoreId = `dvs_${createId()}` as DocumentVectorStoreId;

		await db.transaction(async (tx) => {
			const [insertedStore] = await tx
				.insert(documentVectorStores)
				.values({
					id: documentVectorStoreId,
					teamDbId: team.dbId,
					name: trimmedName,
				})
				.returning({ dbId: documentVectorStores.dbId });

			const embeddingRows = embeddingProfileIds.map((profileId) => ({
				documentVectorStoreDbId: insertedStore.dbId,
				embeddingProfileId: profileId as EmbeddingProfileId,
				createdAt: new Date(),
			}));
			await tx.insert(documentEmbeddingProfiles).values(embeddingRows);
		});

		revalidatePath("/settings/team/vector-stores/document");
		return { success: true };
	} catch (error) {
		console.error("Failed to create document vector store:", error);
		return {
			success: false,
			error: "Failed to create vector store. Please try again.",
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
function executeManualIngest(
	repositoryData: RepositoryWithStatuses,
	trigger: IngestTrigger,
): void {
	after(async () => {
		await processRepository(repositoryData, trigger);
	});
}
