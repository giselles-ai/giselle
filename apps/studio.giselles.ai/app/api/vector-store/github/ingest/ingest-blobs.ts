import type { Octokit } from "@octokit/core";
import { captureMessage } from "@sentry/nextjs";
import { chunkByLines } from "./chunk";
import { embed } from "./embed";

export interface EmbeddingStore {
	insert(data: GitHubBlobEmbedding): Promise<void>;
	update(data: GitHubBlobEmbedding): Promise<void>;
	delete(key: GitHubBlobEmbeddingKey): Promise<void>;
}

export type GitHubBlobEmbedding = {
	owner: string;
	repo: string;
	commitSha: string;
	fileSha: string;
	path: string;
	nodeId: string;
	embedding: number[];
	chunkIndex: number;
};

export type GitHubBlobEmbeddingKey = Pick<
	GitHubBlobEmbedding,
	"owner" | "repo" | "path"
>;

type IngestBlobsParams = {
	owner: string;
	repo: string;
	lastIngestedCommitSha: string | null;
	dependencies: {
		octokit: Octokit;
		embeddingStore: EmbeddingStore;
	};
};

export async function ingestBlobs(params: IngestBlobsParams) {
	const { owner, repo, lastIngestedCommitSha, dependencies } = params;
	const { octokit, embeddingStore } = dependencies;

	if (lastIngestedCommitSha == null) {
		await fullIngest(octokit, owner, repo, embeddingStore);
	} else {
		await diffIngest(
			octokit,
			owner,
			repo,
			lastIngestedCommitSha,
			embeddingStore,
		);
	}
}

async function fullIngest(
	octokit: Octokit,
	owner: string,
	repo: string,
	embeddingStore: EmbeddingStore,
	maxBlobSize: number = 1 * 1024 * 1024, // 1MiB
) {
	const head = await fetchDefaultBranchHead(octokit, owner, repo);
	const commitSha = head.sha;
	for await (const entry of traverseTree(octokit, owner, repo, commitSha)) {
		const { path, type, sha: fileSha, size } = entry;

		// only ingest blobs
		if (type !== "blob") {
			continue;
		}

		if (fileSha == null || size == null || path == null) {
			console.warn(`Invalid entry: ${JSON.stringify(entry)}`);
			continue;
		}
		if (size > maxBlobSize) {
			console.warn(
				`Blob size is too large: ${size} bytes, skipping: ${fileSha}`,
			);
			continue;
		}

		// TODO: Use queue
		await ingestBlob(
			octokit,
			owner,
			repo,
			path,
			fileSha,
			commitSha,
			embeddingStore,
		);
	}
}

// TODO: Implement this
async function diffIngest(
	octokit: Octokit,
	owner: string,
	repo: string,
	lastIngestedCommitSha: string,
	embeddingStore: EmbeddingStore,
) {
	throw new Error("Not implemented");
}

async function ingestBlob(
	octokit: Octokit,
	owner: string,
	repo: string,
	path: string,
	fileSha: string,
	commitSha: string,
	embeddingStore: EmbeddingStore,
) {
	// fetch
	const blob = await fetchBlob(octokit, owner, repo, fileSha);
	if (blob === null) {
		console.warn(`${owner}/${repo}/${fileSha} may be binary, skipping`);
		return;
	}

	// chunk
	for await (const chunk of chunkByLines(blob.content)) {
		if (chunk.content.length === 0) {
			continue;
		}
		// embed
		const embedding = await embed(chunk.content);
		// store
		await embeddingStore.insert({
			owner,
			repo,
			commitSha,
			fileSha,
			path,
			nodeId: blob.nodeId,
			embedding,
			chunkIndex: chunk.index,
		});
	}
}

async function fetchBlob(
	octokit: Octokit,
	owner: string,
	repo: string,
	fileSha: string,
) {
	// Note This endpoint supports blobs up to 100 megabytes in size.
	// https://docs.github.com/ja/rest/git/blobs?apiVersion=2022-11-28#get-a-blob
	const { data: blobData } = await octokit.request(
		"GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
		{
			owner,
			repo,
			file_sha: fileSha,
		},
	);
	const contentInBytes = Buffer.from(blobData.content, "base64");
	// We want to know if the blob is binary or not, so we use the `fatal` option
	const textDecoder = new TextDecoder("utf-8", { fatal: true });
	try {
		const decodedContent = textDecoder.decode(contentInBytes);
		return {
			content: decodedContent,
			nodeId: blobData.node_id,
		};
	} catch (error: unknown) {
		return null;
	}
}

async function* traverseTree(
	octokit: Octokit,
	owner: string,
	repo: string,
	treeSha: string,
) {
	const { data: treeData } = await octokit.request(
		"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
		{
			owner,
			repo,
			tree_sha: treeSha,
			recursive: "true",
		},
	);
	if (treeData.truncated) {
		/**
		 * The limit for the tree array is 100,000 entries with a maximum size of 7 MB when using the recursive parameter.
		 * https://docs.github.com/ja/rest/git/trees?utm_source=chatgpt.com#get-a-tree
		 *
		 * If this limit is exceeded, please consider another way to ingest the repository.
		 * For example, you can use the git clone or GET tarball API for first time ingestion.
		 */
		captureMessage("Tree is truncated", {
			level: "warning",
			extra: {
				owner,
				repo,
				sha: treeData.sha,
			},
		});
	}

	for (const entry of treeData.tree) {
		yield entry;
	}
}

async function fetchDefaultBranchHead(
	octokit: Octokit,
	owner: string,
	repo: string,
) {
	const { data: repoData } = await octokit.request(
		"GET /repos/{owner}/{repo}",
		{
			owner,
			repo,
		},
	);
	const defaultBranch = repoData.default_branch;
	const { data: branchData } = await octokit.request(
		"GET /repos/{owner}/{repo}/branches/{branch}",
		{
			owner,
			repo,
			branch: defaultBranch,
		},
	);
	return branchData.commit;
}
