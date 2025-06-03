import {
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
} from "@/drizzle";
import { GitHubBlob } from "@/lib/github-schema";
import { fetchDefaultBranchHead, octokit } from "@giselle-sdk/github-tool";
import {
	GitHubBlobLoader,
	type GitHubBlobSource,
	createDocumentChunkStore,
	createIngestionPipeline,
} from "@giselle-sdk/rag2";
import type { Octokit } from "@octokit/core";
import { captureException } from "@sentry/nextjs";
import { and, eq, getTableName } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const maxDuration = 800;

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", {
			status: 401,
		});
	}

	const targetGitHubRepositories = await fetchTargetGitHubRepositories();

	for (const targetGitHubRepository of targetGitHubRepositories) {
		const { owner, repo, installationId, teamDbId } = targetGitHubRepository;

		try {
			// Update status to running
			await updateRepositoryStatus(owner, repo, "running");

			const appId = process.env.GITHUB_APP_ID;
			if (!appId) {
				throw new Error("GITHUB_APP_ID is empty");
			}
			const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
			if (!privateKey) {
				throw new Error("GITHUB_APP_PRIVATE_KEY is empty");
			}

			const octokitClient = octokit({
				strategy: "app-installation",
				appId,
				privateKey,
				installationId,
			});

			// Get actual commit SHA for the default branch
			const defaultBranchCommit = await fetchDefaultBranchHead(
				octokitClient,
				owner,
				repo,
			);
			const commitSha = defaultBranchCommit.sha;

			const source: GitHubBlobSource = {
				type: GitHubBlob.name,
				owner,
				repo,
				commitSha,
			};

			await ingestGitHubRepository({
				octokitClient,
				source,
				teamDbId,
			});

			// Update status to completed
			await updateRepositoryStatus(owner, repo, "completed", source.commitSha);
		} catch (error) {
			console.error(`Failed to ingest ${owner}/${repo}:`, error);
			captureException(error, {
				extra: { owner, repo },
			});
			await updateRepositoryStatus(owner, repo, "failed");
		}
	}

	return new Response("ok", { status: 200 });
}

/**
 * Main GitHub repository ingestion coordination
 */
async function ingestGitHubRepository(params: {
	octokitClient: Octokit;
	source: GitHubBlobSource;
	teamDbId: number;
}): Promise<void> {
	const repositoryIndexDbId = await getRepositoryIndexDbId(
		params.source,
		params.teamDbId,
	);
	const loader = createGitHubLoader(params.octokitClient);
	const chunkStore = await createGitHubChunkStore(repositoryIndexDbId);
	const pipeline = createIngestionPipeline();

	await pipeline.run({
		source: params.source,
		loader,
		chunkStore,
		// sourceScope is now handled internally by chunkStore
	});
}

/**
 * Get repository index database ID
 */
async function getRepositoryIndexDbId(
	source: GitHubBlobSource,
	teamDbId: number,
): Promise<number> {
	const repositoryIndex = await db
		.select({ dbId: githubRepositoryIndex.dbId })
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.owner, source.owner),
				eq(githubRepositoryIndex.repo, source.repo),
				eq(githubRepositoryIndex.teamDbId, teamDbId),
			),
		)
		.limit(1);

	if (repositoryIndex.length === 0) {
		throw new Error(
			`Repository index not found: ${source.owner}/${source.repo}`,
		);
	}

	return repositoryIndex[0].dbId;
}

/**
 * Create GitHub-specific chunk store using new simplified API
 */
async function createGitHubChunkStore(repositoryIndexDbId: number) {
	const postgresUrl = process.env.POSTGRES_URL;
	if (!postgresUrl) {
		throw new Error("POSTGRES_URL environment variable is required");
	}

	return createDocumentChunkStore(
		{ connectionString: postgresUrl },
		GitHubBlob,
		getTableName(githubRepositoryEmbeddings),
		{ repository_index_db_id: repositoryIndexDbId },
	);
}

/**
 * Create GitHub loader using new simplified API
 */
function createGitHubLoader(octokitClient: Octokit) {
	return new GitHubBlobLoader(octokitClient, {
		maxBlobSize: 1 * 1024 * 1024,
		metadataSchema: GitHubBlob.documentMetadataSchema,
	});
}

// ===== HELPER FUNCTIONS =====

type TargetGitHubRepository = {
	owner: string;
	repo: string;
	teamDbId: number;
	installationId: number;
	lastIngestedCommitSha: string | null;
};

async function fetchTargetGitHubRepositories(): Promise<
	TargetGitHubRepository[]
> {
	const records = await db
		.select({
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
			installationId: githubRepositoryIndex.installationId,
			lastIngestedCommitSha: githubRepositoryIndex.lastIngestedCommitSha,
			teamDbId: githubRepositoryIndex.teamDbId,
		})
		.from(githubRepositoryIndex)
		.where(eq(githubRepositoryIndex.status, "idle"));

	return records.map((record) => ({
		owner: record.owner,
		repo: record.repo,
		installationId: record.installationId,
		lastIngestedCommitSha: record.lastIngestedCommitSha,
		teamDbId: record.teamDbId,
	}));
}

async function updateRepositoryStatus(
	owner: string,
	repo: string,
	status: "running" | "completed" | "failed",
	commitSha?: string,
): Promise<void> {
	const updateData: {
		status: "running" | "completed" | "failed";
		lastIngestedCommitSha?: string;
	} = { status };

	if (status === "completed" && commitSha) {
		updateData.lastIngestedCommitSha = commitSha;
	}

	await db
		.update(githubRepositoryIndex)
		.set(updateData)
		.where(
			and(
				eq(githubRepositoryIndex.owner, owner),
				eq(githubRepositoryIndex.repo, repo),
			),
		);
}
