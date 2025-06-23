import { fetchDefaultBranchHead } from "@giselle-sdk/github-tool";
import { captureException } from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { ingestGitHubBlobs } from "./ingest-github-repository";
import {
	buildOctokit,
	fetchTargetGitHubRepositories,
	updateRepositoryStatus,
} from "./utils";

export const maxDuration = 800;

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", {
			status: 401,
		});
	}

	// DEBUG: Get debug commit SHA from URL parameters
	const searchParams = request.nextUrl.searchParams;
	const debugCommitSha = searchParams.get("commitSha");

	const targetGitHubRepositories = await fetchTargetGitHubRepositories();

	for (const targetGitHubRepository of targetGitHubRepositories) {
		const { owner, repo, installationId, teamDbId, dbId } =
			targetGitHubRepository;

		try {
			await updateRepositoryStatus(dbId, "running");

			const octokitClient = buildOctokit(installationId);
			const commit = await fetchDefaultBranchHead(octokitClient, owner, repo);

			// DEBUG: Use debug commit SHA if provided, otherwise use latest commit
			const commitSha = debugCommitSha ?? commit.sha;

			const source = {
				owner,
				repo,
				commitSha,
			};

			console.log(
				`Starting ingestion for ${owner}/${repo} at commit ${commitSha}${
					debugCommitSha ? " (debug mode)" : ""
				}`,
			);

			await ingestGitHubBlobs({
				octokitClient,
				source,
				teamDbId,
			});

			await updateRepositoryStatus(dbId, "completed", commitSha);
		} catch (error) {
			console.error(`Failed to ingest ${owner}/${repo}:`, error);
			captureException(error, {
				extra: { owner, repo },
			});
			await updateRepositoryStatus(dbId, "failed");
		}
	}

	return new Response("ok", { status: 200 });
}
