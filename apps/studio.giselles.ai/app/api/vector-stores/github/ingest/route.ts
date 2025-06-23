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

	const targetGitHubRepositories = await fetchTargetGitHubRepositories();

	for (const targetGitHubRepository of targetGitHubRepositories) {
		const {
			owner,
			repo,
			installationId,
			teamDbId,
			dbId,
			currentIngestionCommitSha,
		} = targetGitHubRepository;
		const octokitClient = buildOctokit(installationId);

		let commitSha: string;
		if (currentIngestionCommitSha != null) {
			commitSha = currentIngestionCommitSha;
		} else {
			const commit = await fetchDefaultBranchHead(octokitClient, owner, repo);
			commitSha = commit.sha;
		}

		try {
			await updateRepositoryStatus(dbId, "running", commitSha);

			const source = {
				owner,
				repo,
				commitSha,
			};

			console.log(
				`Starting ingestion for ${owner}/${repo} at commit ${commitSha}`,
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
			await updateRepositoryStatus(dbId, "failed", commitSha);
		}
	}

	return new Response("ok", { status: 200 });
}
