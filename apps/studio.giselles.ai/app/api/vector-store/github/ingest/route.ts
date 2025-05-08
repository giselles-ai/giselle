import { buildAppInstallationClient } from "@/services/external/github";
import type { NextRequest } from "next/server";
import {
	type EmbeddingStore,
	type GitHubBlobEmbedding,
	type GitHubBlobEmbeddingKey,
	ingestBlobs,
} from "./ingest-blobs";

// ingest GitHub Code
// TODO: implement as a cron job
export async function GET(request: NextRequest) {
	const targetGitHubRepositories = await fetchTargetGitHubRepositories();
	const embeddingStore = new EmbeddingStoreImpl();

	for (const targetGitHubRepository of targetGitHubRepositories) {
		const { owner, repo, installationId, lastIngestedCommitSha } =
			targetGitHubRepository;
		const octokit = await createOctokit(installationId);

		await ingestBlobs({
			owner,
			repo,
			lastIngestedCommitSha,
			dependencies: {
				octokit,
				embeddingStore,
			},
		});
	}

	return new Response("ok", { status: 200 });
}

async function createOctokit(installationId: number) {
	return buildAppInstallationClient(installationId);
}

type TargetGitHubRepository = {
	owner: string;
	repo: string;
	installationId: number;
	lastIngestedCommitSha: string | null;
};

// TODO: fetch target repository from database
// currently returning mock data
async function fetchTargetGitHubRepositories(): Promise<
	TargetGitHubRepository[]
> {
	const targetRepository =
		process.env.EXPERIMENTAL_GITHUB_TARGET_REPOSITORY ?? "giselles-ai/giselle";
	const installationId =
		process.env.EXPERIMENTAL_GITHUB_INGESTION_INSTALLATION_ID ?? "";
	const [owner, repo] = targetRepository.split("/");
	const target: TargetGitHubRepository = {
		owner,
		repo,
		installationId: Number.parseInt(installationId, 10),
		lastIngestedCommitSha: null,
	};

	return [target];
}

// TODO: implement
class EmbeddingStoreImpl implements EmbeddingStore {
	async insert(data: GitHubBlobEmbedding) {
		console.log(
			`insert: ${data.owner}/${data.repo}/${data.path} ${data.chunkIndex}`,
		);
	}

	async delete(key: GitHubBlobEmbeddingKey) {
		console.log(`delete: ${key.owner}/${key.repo}/${key.path}`);
	}

	async update(data: GitHubBlobEmbedding) {
		this.delete(data);
		this.insert(data);
	}
}
