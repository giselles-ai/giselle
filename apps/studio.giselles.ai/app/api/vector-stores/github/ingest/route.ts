import { fetchDefaultBranchHead } from "@giselle-sdk/github-tool";
import { captureException } from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { ingestGitHubBlobs } from "./ingest-github-repository";
import {
	buildOctokit,
	fetchTargetGitHubRepositories,
	updateRepositoryStatusToCompleted,
	updateRepositoryStatusToFailed,
	updateRepositoryStatusToRunning,
} from "./utils";

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
		const { owner, repo, installationId, dbId } = targetGitHubRepository;
		const octokitClient = buildOctokit(installationId);

		const commit = await fetchDefaultBranchHead(octokitClient, owner, repo);
		const commitSha = commit.sha;

		try {
			await updateRepositoryStatusToRunning(dbId);

			const source = {
				owner,
				repo,
				commitSha,
			};

			await ingestGitHubBlobs({
				octokitClient,
				source,
				repositoryIndexDbId: dbId,
			});

			await updateRepositoryStatusToCompleted(dbId, commitSha);
		} catch (error) {
			console.error(`Failed to ingest ${owner}/${repo}:`, error);
			captureException(error, {
				extra: { owner, repo },
			});
			await updateRepositoryStatusToFailed(dbId);
		}
	}

	return new Response("ok", { status: 200 });
}
